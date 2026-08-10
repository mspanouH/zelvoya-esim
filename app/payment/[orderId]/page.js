import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import PaymentScenarioForm from '@/components/PaymentScenarioForm';
import { getOrderById } from '@/lib/order-service';
import { formatPrice } from '@/lib/format';

export const metadata = { title: 'Payment — Zelvoya' };

// States from which paying again makes sense. Anything else means the order has
// already moved on, so we send the customer to their receipt instead.
const PAYABLE = ['CREATED', 'PENDING_PAYMENT', 'PAYMENT_DECLINED', 'PAYMENT_TIMEOUT'];

export default async function PaymentPage({ params }) {
  const { orderId } = await params;
  const order = await getOrderById(orderId);

  if (!order) notFound();

  if (!PAYABLE.includes(order.status)) {
    redirect(`/order/${order.id}`);
  }

  const lastFailure =
    order.status === 'PAYMENT_DECLINED' || order.status === 'PAYMENT_TIMEOUT'
      ? order.failureReason
      : null;

  return (
    <div className="mx-auto max-w-2xl px-5 py-12 sm:px-8 sm:py-16">
      <p className="eyebrow">Order {order.reference}</p>
      <h1 className="type-display mt-3 text-4xl sm:text-5xl">Payment</h1>

      {lastFailure && (
        <p
          role="alert"
          className="mt-6 rounded-xl border border-[var(--z-error)] px-4 py-3 text-sm text-[var(--z-error)]"
        >
          {lastFailure} Nothing has been charged. You can try again below.
        </p>
      )}

      <section
        aria-labelledby="summary-heading"
        className="mt-8 rounded-2xl border border-[var(--z-line)] p-6"
      >
        <h2 id="summary-heading" className="eyebrow">
          You are paying for
        </h2>

        <ul className="mt-4 divide-y divide-[var(--z-line)]">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-4 py-3">
              <div>
                <p className="text-[15px]">{item.destination} eSIM</p>
                <p className="type-mono mt-1 text-xs uppercase tracking-[0.14em] text-[var(--z-ink-soft)]">
                  {item.dataGb} GB · {item.validityDays} days
                </p>
              </div>
              <p className="text-[15px]">
                {formatPrice(item.unitPriceCents, order.currency)}
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex justify-between border-t border-[var(--z-line)] pt-4">
          <p className="type-display text-xl">Total</p>
          <p className="type-display text-xl">
            {formatPrice(order.totalCents, order.currency)}
          </p>
        </div>
      </section>

      <div className="mt-10">
        <PaymentScenarioForm orderId={order.id} />
      </div>

      <p className="mt-8 text-center text-xs leading-relaxed text-[var(--z-ink-soft)]">
        This is a demonstration payment service. No card details are collected,
        no money moves, and no real payment provider is involved. Confirmation
        reaches Zelvoya directly from the payment service, not from this page.
      </p>

      <p className="mt-4 text-center text-sm">
        <Link
          href="/cart"
          className="text-[var(--z-ink-soft)] underline underline-offset-4 hover:text-[var(--z-ink)]"
        >
          Cancel and return to cart
        </Link>
      </p>
    </div>
  );
}
