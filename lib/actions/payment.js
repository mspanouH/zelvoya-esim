'use server';

import { redirect } from 'next/navigation';
import { startPayment } from '@/lib/order-service';
import { OrderError } from '@/lib/order-service';
import { createCharge, isValidScenario } from '@/lib/providers/payment-provider';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { clearCartCookie } from '@/lib/cart';
import { signOrderAccess } from '@/lib/auth';

/**
 * Called when the customer presses "Pay".
 *
 * Note what the browser sends: an order id and a test scenario. It does not
 * send an amount, and it has no way of telling us the payment succeeded. The
 * amount is read from the order in the database, and the outcome arrives on a
 * separate request from the payment provider to /api/payments/callback.
 */
export async function startPaymentAction(previousState, formData) {
  const orderId = String(formData.get('orderId') || '');
  const scenario = String(formData.get('scenario') || '');

  if (!isValidScenario(scenario)) {
    return { error: 'Choose a payment scenario to continue.' };
  }

  let payment;
  let order;

  try {
    ({ payment, order } = await startPayment({ orderId, scenario }));
  } catch (error) {
    if (error instanceof OrderError) {
      return { error: error.message };
    }
    console.error('Could not start payment', error);
    return { error: 'We could not start this payment. Please try again.' };
  }

  try {
    await createCharge({
      paymentId: payment.id,
      orderReference: order.reference,
      amountCents: payment.amountCents,
      currency: payment.currency,
      scenario,
    });
  } catch (error) {
    // The provider itself was unreachable. The order and payment rows still
    // exist, so nothing is lost and the customer can try again.
    console.error('Payment provider unreachable', error);
    return {
      error:
        'We could not reach the payment service. Your order is safe — please try again.',
    };
  }
  // The callback has been processed by now, so the order carries the outcome.
  // The cart is emptied only when the payment actually succeeded — a decline,
  // a timeout or a cancelled attempt leaves the customer's basket intact.
  const settled = await prisma.order.findUnique({
    where: { id: orderId },
    select: { status: true },
  });

  const PAID_STATES = ['PAID', 'PROVISIONING', 'FULFILLED', 'FULFILMENT_FAILED'];

  if (PAID_STATES.includes(settled?.status)) {
    await clearCartCookie();
    revalidatePath('/', 'layout');
  }

  redirect(`/order/${orderId}?t=${signOrderAccess(orderId)}`);
}
