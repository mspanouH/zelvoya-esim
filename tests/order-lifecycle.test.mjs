// Exercises the order state machine the way the real payment callback would
// drive it, but by calling applyPaymentEvent() directly instead of going
// over HTTP — app/api/payments/callback/route.js is a thin wrapper (verify
// the signature, parse the JSON) around exactly this function, so this is
// the fast, deterministic way to prove the logic itself is correct.
//
// DATABASE: these run against whatever DATABASE_URL is already configured in
// .env — the same database `npm run dev` uses. A separate test database was
// the other option on the table, but that means a second Neon branch and a
// second connection string to set up and document for no real benefit here:
// every test creates its own Order (against a real seeded Plan) and deletes
// exactly that order's rows in a `finally` block, whether it passes or
// fails. Nothing is shared between tests, nothing is left behind, and Plan
// and User rows are never written to or deleted. Run `npx prisma db seed`
// first if the six plans and two demo accounts aren't already there.
//
// Run with: npm test
//
// The "test" script passes a glob ("tests/**/*.test.mjs"), not a bare
// directory. `node --test tests/` — the plain directory form — reliably
// fails on this Node 22 / Windows combination: it gets treated as the main
// script to run rather than a discovery root (ERR_MODULE_NOT_FOUND /
// "Cannot find module 'tests'"), confirmed by testing directory, file, and
// glob forms directly. An explicit file path or a glob both resolve
// correctly, so the script uses a glob. Worth re-testing the plain directory
// form if this ever runs on a different platform or Node version.
//
// NOISY BUT EXPECTED: three of the six tests deliberately trigger a real
// failure path — a duplicate PaymentEvent insert, a simulated provider
// rejection (twice) — and Prisma and lib/order-service.js log those with
// console.error, exactly as they would in production. You'll see
// "prisma:error" and "Fulfilment failed for order ..." lines below even on a
// fully green run. That's the assertion working, not a crash.

import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { prisma, createTestOrder, deleteTestOrder, buildEvent } from './support/helpers.mjs';
import {
  applyPaymentEvent,
  retryFulfilment,
  startPayment,
  getOrderById,
} from '@/lib/order-service';

after(() => prisma.$disconnect());

// --- 1. Successful payment --------------------------------------------------

/**
 * The core happy path. "payment.succeeded" is exactly what the mock payment
 * service delivers after "Successful payment" is chosen on the payment page.
 * This proves the callback actually issues a usable eSIM and advances the
 * order, not just that it's accepted.
 */
test('a successful payment callback fulfils the order and issues one eSIM per line', async () => {
  const order = await createTestOrder();

  try {
    const { payment } = await startPayment({ orderId: order.id, scenario: 'SUCCESS' });

    const result = await applyPaymentEvent(buildEvent('payment.succeeded', payment.id));

    assert.equal(result.status, 'processed');
    assert.equal(result.orderStatus, 'FULFILLED');

    const [reloaded, storedPayment, esims] = await Promise.all([
      getOrderById(order.id),
      prisma.payment.findUnique({ where: { id: payment.id } }),
      prisma.esim.findMany({ where: { orderId: order.id } }),
    ]);

    assert.equal(reloaded.status, 'FULFILLED');
    assert.equal(storedPayment.status, 'SUCCEEDED');
    assert.equal(esims.length, order.items.length); // one eSIM per order line

    for (const esim of esims) {
      assert.match(esim.iccid, /^89\d{18}$/); // 89 prefix + 17 digits + Luhn check digit
      assert.match(esim.qrData, /^LPA:1\$/); // the real GSMA activation-string format
    }
  } finally {
    await deleteTestOrder(order.id);
  }
});

// --- 2. Duplicate callback ---------------------------------------------------

/**
 * A payment provider redelivers a callback whenever it doesn't get a fast
 * enough 2xx — that's normal operation, not an edge case, and it's exactly
 * what the admin "Resend this payment notification" button demonstrates.
 * The unique constraint on PaymentEvent.eventId is what has to hold here.
 */
test('a duplicate callback with the same eventId does not double-fulfil', async () => {
  const order = await createTestOrder();

  try {
    const { payment } = await startPayment({ orderId: order.id, scenario: 'SUCCESS' });
    const event = buildEvent('payment.succeeded', payment.id);

    const first = await applyPaymentEvent(event);
    assert.equal(first.status, 'processed');
    assert.equal(first.orderStatus, 'FULFILLED');

    const esimsAfterFirst = await prisma.esim.count({ where: { orderId: order.id } });

    // Same event object, same eventId, delivered a second time.
    const second = await applyPaymentEvent(event);
    assert.equal(second.status, 'already_handled');
    assert.equal(second.eventId, event.eventId);

    const [esimsAfterSecond, reloaded] = await Promise.all([
      prisma.esim.count({ where: { orderId: order.id } }),
      getOrderById(order.id),
    ]);

    assert.equal(esimsAfterSecond, esimsAfterFirst); // no second eSIM
    assert.equal(reloaded.status, 'FULFILLED'); // status unchanged
  } finally {
    await deleteTestOrder(order.id);
  }
});

// --- 3. Declined payment -----------------------------------------------------

/**
 * A decline is a normal outcome, not a failure of the system: nothing was
 * charged, nothing should be provisioned, and the order has to survive so
 * the customer can try again from the same page.
 */
test('a declined payment leaves the order in PAYMENT_DECLINED with no eSIM issued', async () => {
  const order = await createTestOrder();

  try {
    const { payment } = await startPayment({ orderId: order.id, scenario: 'DECLINE' });

    const result = await applyPaymentEvent(
      buildEvent('payment.declined', payment.id, {
        reason: 'The card issuer declined this payment.',
      })
    );

    assert.equal(result.orderStatus, 'PAYMENT_DECLINED');

    const [reloaded, storedPayment, esimCount] = await Promise.all([
      getOrderById(order.id),
      prisma.payment.findUnique({ where: { id: payment.id } }),
      prisma.esim.count({ where: { orderId: order.id } }),
    ]);

    assert.ok(reloaded); // still retrievable
    assert.equal(reloaded.status, 'PAYMENT_DECLINED');
    assert.equal(storedPayment.status, 'DECLINED');
    assert.equal(esimCount, 0);
  } finally {
    await deleteTestOrder(order.id);
  }
});

// --- 4. Payment timeout -------------------------------------------------------

/**
 * A timeout is not a decline — no answer arrived at all — but it has to
 * fail exactly as safely: nothing charged, nothing provisioned, order
 * intact.
 */
test('a payment timeout leaves the order in PAYMENT_TIMEOUT with no eSIM issued', async () => {
  const order = await createTestOrder();

  try {
    const { payment } = await startPayment({ orderId: order.id, scenario: 'TIMEOUT' });

    const result = await applyPaymentEvent(
      buildEvent('payment.timeout', payment.id, {
        reason: 'No response from the card issuer in time.',
      })
    );

    assert.equal(result.orderStatus, 'PAYMENT_TIMEOUT');

    const [reloaded, storedPayment, esimCount] = await Promise.all([
      getOrderById(order.id),
      prisma.payment.findUnique({ where: { id: payment.id } }),
      prisma.esim.count({ where: { orderId: order.id } }),
    ]);

    assert.ok(reloaded); // still retrievable
    assert.equal(reloaded.status, 'PAYMENT_TIMEOUT');
    assert.equal(storedPayment.status, 'TIMED_OUT');
    assert.equal(esimCount, 0);
  } finally {
    await deleteTestOrder(order.id);
  }
});

// --- 5. Provider failure after a successful payment --------------------------

/**
 * The scenario the brief cares about most: the customer has paid and the
 * eSIM provider then fails. Losing the order here would mean a customer who
 * was charged and got nothing, with no record of it — this proves that
 * can't happen. SUCCESS_PROVIDER_FAIL is the same scenario
 * PaymentScenarioForm offers as "Payment succeeds, eSIM provisioning
 * fails": the payment clears for real, and handlePaymentSucceeded reads
 * payment.scenario to tell fulfilOrder() to simulate the provider itself
 * rejecting provisioning — the existing simulateFailure path, not a mock.
 */
test('a provider failure after a successful payment leaves the order recoverable, not lost', async () => {
  const order = await createTestOrder();

  try {
    const { payment } = await startPayment({
      orderId: order.id,
      scenario: 'SUCCESS_PROVIDER_FAIL',
    });

    const result = await applyPaymentEvent(buildEvent('payment.succeeded', payment.id));

    assert.equal(result.orderStatus, 'FULFILMENT_FAILED');

    const [reloaded, storedPayment, esimCount] = await Promise.all([
      getOrderById(order.id),
      prisma.payment.findUnique({ where: { id: payment.id } }),
      prisma.esim.count({ where: { orderId: order.id } }),
    ]);

    assert.ok(reloaded); // the order still exists — it was not lost
    assert.equal(reloaded.status, 'FULFILMENT_FAILED');
    assert.ok(reloaded.failureReason); // a human-readable reason is recorded
    assert.equal(storedPayment.status, 'SUCCEEDED'); // the charge itself still went through
    assert.equal(esimCount, 0); // nothing was issued
  } finally {
    await deleteTestOrder(order.id);
  }
});

// --- 6. Admin retry ------------------------------------------------------------

/**
 * The recovery path for case 5. Retry has to reach the same order that
 * already paid — never create a new one — and it has to be safe to press
 * even if something upstream already partially succeeded.
 */
test('admin retry on a FULFILMENT_FAILED order fulfils it without duplicating the eSIM', async () => {
  const order = await createTestOrder();

  try {
    const { payment } = await startPayment({
      orderId: order.id,
      scenario: 'SUCCESS_PROVIDER_FAIL',
    });
    const failed = await applyPaymentEvent(buildEvent('payment.succeeded', payment.id));
    assert.equal(failed.orderStatus, 'FULFILMENT_FAILED'); // sanity check on the setup

    const retried = await retryFulfilment(order.id);
    assert.equal(retried.orderStatus, 'FULFILLED');

    const [reloaded, esims] = await Promise.all([
      getOrderById(order.id),
      prisma.esim.findMany({ where: { orderId: order.id } }),
    ]);

    assert.equal(reloaded.status, 'FULFILLED');
    assert.equal(reloaded.failureReason, null);
    assert.equal(esims.length, 1); // exactly one — no duplicate delivery
    assert.equal(esims[0].orderItemId, order.items[0].id);
  } finally {
    await deleteTestOrder(order.id);
  }
});
