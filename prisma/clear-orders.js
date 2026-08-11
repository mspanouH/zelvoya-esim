/**
 * Clears order data, leaving plans and users intact.
 *
 * Run with:  node prisma/clear-orders.js
 *
 * Deletion order matters. Esim, Payment and PaymentEvent are deliberately NOT
 * cascade-deleted in the schema — financial and delivery records should never
 * disappear because something upstream was removed — so they have to be
 * cleared explicitly, children before parents.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const events = await prisma.paymentEvent.deleteMany();
  const esims = await prisma.esim.deleteMany();
  const payments = await prisma.payment.deleteMany();
  const items = await prisma.orderItem.deleteMany();
  const orders = await prisma.order.deleteMany();

  console.log(`Deleted ${events.count} payment events`);
  console.log(`Deleted ${esims.count} eSIMs`);
  console.log(`Deleted ${payments.count} payments`);
  console.log(`Deleted ${items.count} order items`);
  console.log(`Deleted ${orders.count} orders`);
  console.log('Plans and users were not touched.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());