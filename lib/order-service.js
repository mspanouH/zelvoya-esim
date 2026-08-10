import { randomInt } from 'crypto';
import { prisma } from '@/lib/db';
import { provisionEsim, EsimProviderError } from '@/lib/providers/esim-provider';
/**
 * Order service.
 *
 * All order lifecycle logic lives here. Pages and route handlers call these
 * functions; they never write order rows themselves. That keeps one place to
 * look when asking "what can change an order's state".
 */

/** Errors safe to show the customer. Anything else is a bug and stays generic. */
export class OrderError extends Error {}

/**
 * Human-facing reference, e.g. ZV-K7M2QX.
 *
 * Ambiguous characters (I, L, O, 0, 1) are excluded so a customer reading it
 * down the phone cannot get it wrong. randomInt is the cryptographic RNG, not
 * Math.random — references should not be guessable.
 */
function generateReference() {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[randomInt(alphabet.length)];
  }
  return `ZV-${code}`;
}

/**
 * Turn a cart into an order.
 *
 * The cart cookie contributes only a list of slugs — what the customer wants.
 * Every price is read fresh from the database here. The browser never tells the
 * server what anything costs, because the browser can be edited.
 */
export async function createOrder({ email, customerName, slugs,  userId = null }) {
  if (!Array.isArray(slugs) || slugs.length === 0) {
    throw new OrderError('Your cart is empty.');
  }

  const plans = await prisma.plan.findMany({
    where: { slug: { in: slugs } },
  });
  const bySlug = new Map(plans.map((plan) => [plan.slug, plan]));

  const items = slugs.map((slug) => {
    const plan = bySlug.get(slug);

    if (!plan) {
      throw new OrderError('One of the plans in your cart is no longer sold.');
    }
    if (!plan.available) {
      throw new OrderError(`${plan.destination} is currently unavailable.`);
    }

    // Snapshot the plan as it is right now. If the price changes tomorrow, this
    // order still shows what was actually bought.
    return {
      planId: plan.id,
      destination: plan.destination,
      dataGb: plan.dataGb,
      validityDays: plan.validityDays,
      unitPriceCents: plan.priceCents,
    };
  });

  const totalCents = items.reduce((sum, item) => sum + item.unitPriceCents, 0);

  // A nested create runs as a single transaction: either the order and all its
  // items are written, or nothing is. An order with missing lines cannot exist.
  return prisma.order.create({
    data: {
      reference: generateReference(),
      status: 'CREATED',
      email,
      customerName,
      userId, 
      totalCents,
      currency: 'EUR',
      items: { create: items },
    },
    include: { items: true },
  });
}

export async function getOrderById(id) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { esim: true } },
      payments: { orderBy: { createdAt: 'desc' } },
      esims: true,
    },
  });
}
// States from which starting (or retrying) a payment is valid.
const PAYABLE = ['CREATED', 'PENDING_PAYMENT', 'PAYMENT_DECLINED', 'PAYMENT_TIMEOUT'];

/**
 * Move an order to PENDING_PAYMENT and open a payment attempt.
 *
 * The amount comes from the order row, never from the request. One order can
 * have several payments — a decline followed by a successful retry — so the
 * history is preserved rather than overwritten.
 */
export async function startPayment({ orderId, scenario }) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });

  if (!order) {
    throw new OrderError('We could not find that order.');
  }
  if (!PAYABLE.includes(order.status)) {
    throw new OrderError('This order has already been paid.');
  }

  const payment = await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: { status: 'PENDING_PAYMENT', failureReason: null },
    });

    return tx.payment.create({
      data: {
        orderId,
        amountCents: order.totalCents,
        currency: order.currency,
        scenario,
        status: 'PENDING',
      },
    });
  });

  return { payment, order };
}
export async function applyPaymentEvent(event) {
  const { eventId, type, data } = event;
 
  const payment = await prisma.payment.findUnique({
    where: { id: data?.paymentId },
    include: { order: true },
  });
 
  if (!payment) {
    return { status: 'ignored', reason: 'unknown_payment', eventId };
  }
 
  // 1. Record the event. This is the idempotency gate.
  try {
    await prisma.paymentEvent.create({
      data: {
        eventId,
        paymentId: payment.id,
        type,
        payload: event,
      },
    });
  } catch (error) {
    if (error.code === 'P2002') {
      // Already processed. A valid response, not an error — otherwise the
      // provider keeps retrying a callback we have already acted on.
      return { status: 'already_handled', eventId };
    }
    throw error;
  }
 
  // 2. Act on it. Only reached the first time this event is seen.
  switch (type) {
    case 'payment.succeeded':
      return handlePaymentSucceeded(payment, event);
 
    case 'payment.declined':
      return handlePaymentFailed(payment, event, {
        paymentStatus: 'DECLINED',
        orderStatus: 'PAYMENT_DECLINED',
        fallbackReason: 'The payment was declined.',
      });
 
    case 'payment.timeout':
      return handlePaymentFailed(payment, event, {
        paymentStatus: 'TIMED_OUT',
        orderStatus: 'PAYMENT_TIMEOUT',
        fallbackReason: 'The payment timed out.',
      });
 
    default:
      return { status: 'ignored', reason: 'unknown_type', eventId };
  }
}
 
async function handlePaymentSucceeded(payment, event) {
  // Marking the payment and the order happens in one transaction: a paid
  // payment attached to an unpaid order is not a state we allow to exist.
  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'SUCCEEDED' },
    }),
    prisma.order.update({
      where: { id: payment.orderId },
      data: { status: 'PAID', failureReason: null },
    }),
  ]);
 
  // Fulfilment is deliberately outside that transaction. It calls an external
  // provider, which can be slow or fail — and a failure there must not undo the
  // fact that the customer paid.
  const fulfilment = await fulfilOrder(payment.orderId, {
    simulateProviderFailure: payment.scenario === 'SUCCESS_PROVIDER_FAIL',
  });
 
  return {
    status: 'processed',
    eventId: event.eventId,
    orderStatus: fulfilment.orderStatus,
  };
}
 
async function handlePaymentFailed(payment, event, config) {
  const reason = event.data?.reason || config.fallbackReason;
 
  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: { status: config.paymentStatus },
    }),
    prisma.order.update({
      where: { id: payment.orderId },
      data: { status: config.orderStatus, failureReason: reason },
    }),
  ]);
 
  return { status: 'processed', eventId: event.eventId, orderStatus: config.orderStatus };
}
 
/**
 * Issue an eSIM for every line of a paid order.
 *
 * Also the admin retry path — retrying is just running this again. It is safe
 * to run repeatedly because:
 *
 *   - lines that already have an eSIM are skipped
 *   - Esim.orderItemId is unique, so a second row for the same line cannot be
 *     written even if two retries overlap
 *
 * On failure the order is left in FULFILMENT_FAILED with a reason. The order is
 * never deleted or rolled back: the customer has paid, and that has to survive.
 */
export async function fulfilOrder(orderId, { simulateProviderFailure = false } = {}) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { esim: true } } },
  });
 
  if (!order) {
    throw new OrderError('We could not find that order.');
  }
 
  const FULFILLABLE = ['PAID', 'PROVISIONING', 'FULFILMENT_FAILED'];
  if (!FULFILLABLE.includes(order.status)) {
    return { orderStatus: order.status, skipped: true };
  }
 
  await prisma.order.update({
    where: { id: orderId },
    data: { status: 'PROVISIONING', failureReason: null },
  });
 
  const pending = order.items.filter((item) => !item.esim);
 
  try {
    for (const item of pending) {
      const issued = await provisionEsim({
        orderReference: order.reference,
        simulateFailure: simulateProviderFailure,
      });
 
      try {
        await prisma.esim.create({
          data: {
            orderId: order.id,
            orderItemId: item.id,
            iccid: issued.iccid,
            activationCode: issued.activationCode,
            smdpAddress: issued.smdpAddress,
            qrData: issued.qrData,
            providerRef: issued.providerRef,
            status: 'ISSUED',
          },
        });
      } catch (error) {
        // Another run got there first. Not a failure — the line is fulfilled.
        if (error.code !== 'P2002') throw error;
      }
    }
  } catch (error) {
    const reason =
      error instanceof EsimProviderError
        ? error.message
        : 'The eSIM provider could not be reached.';
 
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'FULFILMENT_FAILED', failureReason: reason },
    });
 
    console.error('Fulfilment failed for order', order.reference, error);
 
    return { orderStatus: 'FULFILMENT_FAILED', error: reason };
  }
 
  await prisma.order.update({
    where: { id: orderId },
    data: { status: 'FULFILLED', failureReason: null },
  });
 
  return { orderStatus: 'FULFILLED' };
}
 
/**
 * Admin retry. Runs the same fulfilment against the same order — never creates
 * a new one, and cannot duplicate delivery.
 */
export async function retryFulfilment(orderId) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
 
  if (!order) {
    throw new OrderError('We could not find that order.');
  }
  if (order.status !== 'FULFILMENT_FAILED') {
    throw new OrderError('Only failed fulfilments can be retried.');
  }
 
  return fulfilOrder(orderId, { simulateProviderFailure: false });
}
 