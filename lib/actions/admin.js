'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import { retryFulfilment, OrderError } from '@/lib/order-service';
import { deliverCallback } from '@/lib/providers/payment-provider';

/**
 * Every action here re-checks the admin role.
 *
 * The layout already redirects non-admins away from the pages, but a server
 * action is a network endpoint in its own right — it can be invoked without the
 * page ever being loaded. Guarding the page is not the same as guarding the
 * action.
 */

export async function retryFulfilmentAction(previousState, formData) {
  if (!(await isAdmin())) {
    return { error: 'Not authorised.' };
  }

  const orderId = String(formData.get('orderId') || '');

  try {
    const result = await retryFulfilment(orderId);

    revalidatePath('/admin/orders');
    revalidatePath(`/order/${orderId}`);

    return result.orderStatus === 'FULFILLED'
      ? { message: 'Fulfilled. The eSIM is now visible to the customer.' }
      : { error: `Retry failed again: ${result.error || result.orderStatus}` };
  } catch (error) {
    if (error instanceof OrderError) {
      return { error: error.message };
    }
    console.error('Retry failed', error);
    return { error: 'Retry failed. Check the server logs.' };
  }
}

/**
 * Redeliver the most recent payment event for an order, unchanged.
 *
 * Same eventId, same payload, same signature. This is what a payment provider
 * does when it does not receive a timely 2xx — and it is how the idempotency
 * guarantee is demonstrated rather than merely described.
 *
 * The expected result is "already_handled", with no second eSIM created.
 */
export async function replayLastEventAction(previousState, formData) {
  if (!(await isAdmin())) {
    return { error: 'Not authorised.' };
  }

  const orderId = String(formData.get('orderId') || '');

  const lastEvent = await prisma.paymentEvent.findFirst({
    where: { payment: { orderId } },
    orderBy: { receivedAt: 'desc' },
  });

  if (!lastEvent) {
    return { error: 'This order has no payment events to replay.' };
  }

  try {
    const response = await deliverCallback(lastEvent.payload);

    revalidatePath('/admin/orders');

    return {
      message: `Replayed ${lastEvent.eventId} — the endpoint responded ${response.status}. No duplicate was created.`,
    };
  } catch (error) {
    console.error('Replay failed', error);
    return { error: 'Could not reach the callback endpoint.' };
  }
}
