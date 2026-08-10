import { randomInt } from 'crypto';
import { prisma } from '@/lib/db';

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
export async function createOrder({ email, customerName, slugs }) {
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
