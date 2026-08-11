// Shared setup for the order-lifecycle tests: find a real seeded plan,
// create a throwaway order against it, and delete exactly that one order's
// rows afterwards. Never touches Plan or User rows.
import { randomUUID } from 'node:crypto';
import { prisma } from '@/lib/db';
import { createOrder } from '@/lib/order-service';

export { prisma };

let cachedPlan;

async function getSeededPlan() {
  if (cachedPlan) return cachedPlan;

  cachedPlan = await prisma.plan.findFirst({ where: { available: true } });

  if (!cachedPlan) {
    throw new Error(
      'No plans found in the database. Run `npx prisma db seed` before running the tests.'
    );
  }

  return cachedPlan;
}

/** A fresh, real one-line order for a test to drive through the lifecycle. */
export async function createTestOrder() {
  const plan = await getSeededPlan();

  return createOrder({
    email: `test-${randomUUID()}@zelvoya.test`,
    customerName: 'Test Customer',
    slugs: [plan.slug],
  });
}

/**
 * Deletes one order and its children, in the order the schema requires —
 * nothing here cascade-deletes (see the comment in prisma/clear-orders.js).
 * Scoped to a single orderId, so it can never touch another order, and never
 * touches Plan or User.
 */
export async function deleteTestOrder(orderId) {
  const payments = await prisma.payment.findMany({
    where: { orderId },
    select: { id: true },
  });
  const paymentIds = payments.map((payment) => payment.id);

  if (paymentIds.length > 0) {
    await prisma.paymentEvent.deleteMany({ where: { paymentId: { in: paymentIds } } });
  }
  await prisma.esim.deleteMany({ where: { orderId } });
  await prisma.payment.deleteMany({ where: { orderId } });
  await prisma.orderItem.deleteMany({ where: { orderId } });
  await prisma.order.delete({ where: { id: orderId } });
}

/** A minimal, realistic payment-callback event, shaped how applyPaymentEvent expects it. */
export function buildEvent(type, paymentId, data = {}) {
  return {
    eventId: `evt_test_${randomUUID()}`,
    type,
    createdAt: new Date().toISOString(),
    data: { paymentId, ...data },
  };
}
