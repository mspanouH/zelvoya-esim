import Link from 'next/link';
import { notFound } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';
import EsimCard from '@/components/EsimCard';
import { getOrderById } from '@/lib/order-service';
import { formatPrice } from '@/lib/format';

export const metadata = { title: 'Your order — Zelvoya' };

/**
 * What the customer is told, per state.
 *
 * FULFILMENT_FAILED is the important one. The customer has paid, so the message
 * reassures rather than alarms — the failure is ours to fix, not theirs. The
 * real state name is visible to admin, never here.
 */
const MESSAGES = {
  CREATED: {
    heading: 'Your order is waiting for payment',
    body: 'Nothing has been charged yet. Complete payment to receive your eSIM.',
  },
  PENDING_PAYMENT: {
    heading: 'Payment in progress',
    body: 'We are waiting for the payment service to confirm. This page updates when you refresh.',
  },
  PAID: {
    heading: 'Payment confirmed',
    body: 'Your payment went through. We are preparing your eSIM now.',
  },
  PROVISIONING: {
    heading: 'Preparing your eSIM',
    body: 'Your payment is confirmed and your eSIM is being issued. This usually takes a few seconds.',
  },
  FULFILLED: {
    heading: 'Your eSIM is ready',
    body: 'Scan the QR code below to install it. You can come back to this page any time from your account.',
  },
  PAYMENT_DECLINED: {
    heading: 'Your payment was declined',
    body: 'Nothing has been charged. Your order is saved and you can try paying again.',
  },
  PAYMENT_TIMEOUT: {
    heading: 'Your payment timed out',
    body: 'Nothing has been charged. Your order is saved and you can try paying again.',
  },
  FULFILMENT_FAILED: {
    heading: 'Your payment is confirmed',
    body: 'We are currently preparing your eSIM and it is taking longer than usual. Your order is safe and our team has been notified — you will receive your QR code shortly.',
  },
};

const RETRY_PAYMENT = ['CREATED', 'PENDING_PAYMENT', 'PAYMENT_DECLINED', 'PAYMENT_TIMEOUT'];

export default async function OrderPage({ params }) {
  const { orderId } = await params;
  const order = await getOrderById(orderId);

  if (!order) notFound();

  const message = MESSAGES[order.status] || MESSAGES.PENDING_PAYMENT;
  const esimByItemId = new Map(order.esims.map((esim) => [esim.orderItemId, esim]));

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
      <p className="eyebrow">Order {order.reference}</p>

      <div className="mt-3 flex flex-wrap items-center gap-4">
        <h1 className="type-display text-4xl sm:text-5xl">{message.heading}</h1>
      </div>

      <div className="mt-4">
        <StatusBadge status={order.status} />
      </div>

      <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-[var(--z-ink-soft)]">
        {message.body}
      </p>

      {RETRY_PAYMENT.includes(order.status) && (
        <Link
          href={`/payment/${order.id}`}
          className="btn btn-primary mt-7 px-7 py-4"
        >
          {order.status === 'CREATED' ? 'Complete payment' : 'Try payment again'}
        </Link>
      )}

      {order.status === 'FULFILLED' && (
        <section aria-labelledby="esims-heading" className="mt-14">
          <h2 id="esims-heading" className="type-display text-3xl">
            Your eSIMs
          </h2>
          <div className="mt-6 space-y-6">
            {order.items.map((item) => {
              const esim = esimByItemId.get(item.id);
              if (!esim) return null;
              return (
                <EsimCard
                  key={item.id}
                  esim={esim}
                  destination={item.destination}
                />
              );
            })}
          </div>
        </section>
      )}

      <section aria-labelledby="receipt-heading" className="mt-14">
        <h2 id="receipt-heading" className="type-display text-3xl">
          Receipt
        </h2>

        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-b border-[var(--z-line)] pb-6">
          <div>
            <dt className="eyebrow">Order reference</dt>
            <dd className="type-mono mt-1 text-sm">{order.reference}</dd>
          </div>
          <div>
            <dt className="eyebrow">Date</dt>
            <dd className="mt-1 text-sm">
              {new Date(order.createdAt).toLocaleDateString('en-IE', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </dd>
          </div>
          <div>
            <dt className="eyebrow">Name</dt>
            <dd className="mt-1 text-sm">{order.customerName || '—'}</dd>
          </div>
          <div>
            <dt className="eyebrow">Email</dt>
            <dd className="mt-1 break-all text-sm">{order.email}</dd>
          </div>
        </dl>

        <ul className="divide-y divide-[var(--z-line)]">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-4 py-4">
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

        <div className="flex justify-between border-t border-[var(--z-line)] pt-5">
          <p className="type-display text-xl">Total</p>
          <p className="type-display text-xl">
            {formatPrice(order.totalCents, order.currency)}
          </p>
        </div>
        <p className="mt-1 text-xs text-[var(--z-ink-soft)]">
          VAT included where applicable.
        </p>
      </section>

      <p className="mt-12 text-sm text-[var(--z-ink-soft)]">
        Keep this page bookmarked, or find it any time in{' '}
        <Link
          href="/account"
          className="text-[var(--z-ink)] underline underline-offset-4"
        >
          your account
        </Link>
        . Questions?{' '}
        <Link
          href="/contact"
          className="text-[var(--z-ink)] underline underline-offset-4"
        >
          Contact support
        </Link>
        .
      </p>
    </div>
  );
}
