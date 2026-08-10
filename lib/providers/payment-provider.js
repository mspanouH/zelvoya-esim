import { createHmac, timingSafeEqual, randomUUID } from 'crypto';

/**
 * Mock payment provider.
 *
 * Stands in for a real payment service provider. It accepts a charge, waits,
 * and then delivers a signed callback to our own API — a separate HTTP request
 * that the customer's browser is not part of.
 *
 * Everything an integration with a real PSP would involve is here in miniature:
 * a shared signing secret, a unique event id per delivery, and an outcome we
 * only learn about server-side.
 */

const CALLBACK_PATH = '/api/payments/callback';

const SCENARIOS = {
  SUCCESS: {
    type: 'payment.succeeded',
    delayMs: 700,
    reason: null,
  },
  DECLINE: {
    type: 'payment.declined',
    delayMs: 700,
    reason: 'The card issuer declined this payment.',
  },
  TIMEOUT: {
    type: 'payment.timeout',
    delayMs: 2500,
    reason: 'No response from the card issuer in time.',
  },
  SUCCESS_PROVIDER_FAIL: {
    type: 'payment.succeeded',
    delayMs: 700,
    reason: null,
  },
};

export function isValidScenario(scenario) {
  return Object.prototype.hasOwnProperty.call(SCENARIOS, scenario);
}

export function listScenarios() {
  return Object.keys(SCENARIOS);
}

/**
 * Sign a payload with the shared secret.
 *
 * HMAC-SHA256 over the exact bytes we are going to send. The receiving end
 * recomputes it from the raw request body and compares.
 */
export function signPayload(rawBody) {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;

  if (!secret) {
    throw new Error('PAYMENT_WEBHOOK_SECRET is not set');
  }

  return createHmac('sha256', secret).update(rawBody).digest('hex');
}

/**
 * Verify a signature we received.
 *
 * timingSafeEqual compares in constant time. A normal === returns as soon as it
 * finds a difference, so an attacker could measure response times to work out
 * the signature one character at a time. Unlikely here; standard practice
 * everywhere signatures are checked.
 */
export function verifySignature(rawBody, signature) {
  if (typeof signature !== 'string' || signature.length === 0) return false;

  const expected = Buffer.from(signPayload(rawBody), 'utf8');
  const received = Buffer.from(signature, 'utf8');

  if (expected.length !== received.length) return false;

  return timingSafeEqual(expected, received);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Start a charge. Resolves once the provider has delivered its callback.
 *
 * TRADE-OFF: a real provider delivers callbacks independently, possibly minutes
 * later, and the customer waits on a status page. Here the delivery is awaited
 * so the demo is deterministic — a background task started in a serverless
 * function can be killed the moment that function returns.
 *
 * The delivery is still a genuine server-to-server HTTP request that the
 * browser cannot make or forge. Only the timing is compressed.
 */
export async function createCharge({
  paymentId,
  orderReference,
  amountCents,
  currency,
  scenario,
}) {
  const config = SCENARIOS[scenario];

  if (!config) {
    throw new Error(`Unknown payment scenario: ${scenario}`);
  }

  await wait(config.delayMs);

  const event = {
    eventId: `evt_${randomUUID()}`,
    type: config.type,
    createdAt: new Date().toISOString(),
    data: {
      paymentId,
      orderReference,
      amountCents,
      currency,
      providerRef: `mock_${randomUUID().slice(0, 8)}`,
      reason: config.reason,
    },
  };

  return deliverCallback(event);
}

/**
 * Deliver one event to our callback endpoint.
 *
 * Exported separately so the same event can be delivered again — which is how
 * we demonstrate that duplicate callbacks do not double-fulfil.
 */
export async function deliverCallback(event) {
  const rawBody = JSON.stringify(event);
  const signature = signPayload(rawBody);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_BASE_URL is not set');
  }

  const response = await fetch(`${baseUrl}${CALLBACK_PATH}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-zelvoya-signature': signature,
    },
    body: rawBody,
    cache: 'no-store',
  });

  return {
    ok: response.ok,
    status: response.status,
    eventId: event.eventId,
  };
}
