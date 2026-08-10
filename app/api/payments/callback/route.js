import { verifySignature } from '@/lib/providers/payment-provider';
import { applyPaymentEvent } from '@/lib/order-service';

/**
 * POST /api/payments/callback
 *
 * The only place an order can become PAID.
 *
 * This is a Route Handler: a real HTTP endpoint, reached by the payment
 * provider server-to-server. The customer's browser never calls it, and could
 * not usefully forge a call to it — every request must carry a valid signature
 * computed with a secret the browser has never seen.
 *
 * Three guards, in order:
 *   1. valid signature       → otherwise 401, nothing is touched
 *   2. parseable JSON        → otherwise 400
 *   3. unseen event id       → otherwise 200 "already handled"
 */
export async function POST(request) {
  // Read the body as raw text, not JSON. The signature was computed over these
  // exact bytes, and JSON.parse followed by JSON.stringify does not reliably
  // reproduce them — key order and whitespace can differ.
  const rawBody = await request.text();
  const signature = request.headers.get('x-zelvoya-signature');

  if (!verifySignature(rawBody, signature)) {
    console.warn('Rejected payment callback with an invalid signature');
    return Response.json({ error: 'invalid_signature' }, { status: 401 });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 });
  }

  if (!event?.eventId || !event?.type) {
    return Response.json({ error: 'missing_fields' }, { status: 400 });
  }

  try {
    const result = await applyPaymentEvent(event);

    // 200 in every handled case, including duplicates. A non-2xx response tells
    // the provider to retry, and there is nothing to retry when the event has
    // already been processed.
    return Response.json(result, { status: 200 });
  } catch (error) {
    console.error('Payment callback failed', error);

    // 500 here is deliberate: something genuinely went wrong and we WANT the
    // provider to deliver this event again.
    return Response.json({ error: 'processing_failed' }, { status: 500 });
  }
}
