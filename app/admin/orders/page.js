import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';
import AdminOrderActions from '@/components/AdminOrderActions';
import AdminOrderFilters from '@/components/AdminOrderFilters';
import { prisma } from '@/lib/db';
import { formatPrice } from '@/lib/format';

export const metadata = { title: 'Orders — Zelvoya admin' };

const SORT_ORDERS = {
  newest: { createdAt: 'desc' },
  oldest: { createdAt: 'asc' },
  highest: { totalCents: 'desc' },
  lowest: { totalCents: 'asc' },
};

const VALID_STATUSES = [
  'CREATED',
  'PENDING_PAYMENT',
  'PAID',
  'PROVISIONING',
  'FULFILLED',
  'PAYMENT_DECLINED',
  'PAYMENT_TIMEOUT',
  'FULFILMENT_FAILED',
];

/**
 * Filtering happens in the database, not in JavaScript after fetching
 * everything. With six orders it makes no difference; with sixty thousand it is
 * the difference between a page that loads and one that does not.
 *
 * Both parameters are validated before use — `status` against a known list, and
 * `q` only ever reaches Prisma as a bound parameter, never string-concatenated
 * into a query.
 */
export default async function AdminOrdersPage({ searchParams }) {
  const params = await searchParams;

  const status = VALID_STATUSES.includes(params?.status) ? params.status : '';
  const q = typeof params?.q === 'string' ? params.q.trim() : '';
  const sort = SORT_ORDERS[params?.sort] ? params.sort : 'newest';

  const where = {};
  if (status) where.status = status;
  if (q) {
    where.OR = [
      { reference: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
      { customerName: { contains: q, mode: 'insensitive' } },
    ];
  }

  // Counts are unfiltered on purpose: the tiles describe the whole system, so
  // they should not change as you narrow the list below them.
  const [orders, totalCount, fulfilledCount, failedCount] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: true,
        payments: { orderBy: { createdAt: 'desc' }, include: { events: true } },
        _count: { select: { esims: true } },
      },
      orderBy: SORT_ORDERS[sort],
      take: 100,
    }),
    prisma.order.count(),
    prisma.order.count({ where: { status: 'FULFILLED' } }),
    prisma.order.count({ where: { status: 'FULFILMENT_FAILED' } }),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
      <h1 className="type-display text-4xl">Orders</h1>

      <dl className="mt-8 grid gap-4 sm:grid-cols-3">
        <Link
          href="/admin/orders"
          className="rounded-xl border border-[var(--z-line)] p-5 transition-colors hover:border-[var(--z-ink)]"
        >
          <dt className="eyebrow">Total orders</dt>
          <dd className="type-display mt-1 text-3xl">{totalCount}</dd>
        </Link>

        <Link
          href="/admin/orders?status=FULFILLED"
          className="rounded-xl border border-[var(--z-line)] p-5 transition-colors hover:border-[var(--z-ink)]"
        >
          <dt className="eyebrow">Fulfilled</dt>
          <dd className="type-display mt-1 text-3xl">{fulfilledCount}</dd>
        </Link>

        <Link
          href="/admin/orders?status=FULFILMENT_FAILED"
          className={`rounded-xl border p-5 transition-colors ${
            failedCount > 0
              ? 'border-[var(--z-error)] hover:bg-[var(--z-mist)]'
              : 'border-[var(--z-line)] hover:border-[var(--z-ink)]'
          }`}
        >
          <dt className="eyebrow">Needs attention</dt>
          <dd className="type-display mt-1 text-3xl">{failedCount}</dd>
        </Link>
      </dl>

      <AdminOrderFilters status={status} q={q} sort={sort} />

      <p className="mt-6 text-sm text-[var(--z-ink-soft)]">
        Showing {orders.length} of {totalCount} orders
        {status && ` · filtered by ${status}`}
        {q && ` · matching “${q}”`}
      </p>

      {orders.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-[var(--z-line)] px-6 py-16 text-center">
          <p className="type-display text-2xl">No orders match</p>
          <p className="mt-2 text-sm text-[var(--z-ink-soft)]">
            {status || q
              ? 'Try clearing the filters, or search for a different reference.'
              : 'Place an order from the storefront to see it here.'}
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {orders.map((order) => {
            const latestPayment = order.payments[0];
            const events = order.payments.flatMap((payment) => payment.events);

            return (
              <li
                key={order.id}
                className={`rounded-2xl border p-6 ${
                  order.status === 'FULFILMENT_FAILED'
                    ? 'border-[var(--z-error)]'
                    : 'border-[var(--z-line)]'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="type-mono text-sm">{order.reference}</p>
                    <p className="mt-1 text-sm text-[var(--z-ink-soft)]">
                      {order.customerName || '—'} · {order.email}
                    </p>
                    <p className="mt-1 text-xs text-[var(--z-ink-soft)]">
                      {new Date(order.createdAt).toLocaleString('en-IE')}
                    </p>
                  </div>

                  <div className="text-right">
                    <StatusBadge status={order.status} adminLabel />
                    <p className="type-display mt-2 text-xl">
                      {formatPrice(order.totalCents, order.currency)}
                    </p>
                  </div>
                </div>

                <dl className="mt-5 grid gap-4 border-t border-[var(--z-line)] pt-5 sm:grid-cols-4">
                  <div>
                    <dt className="eyebrow">Payment</dt>
                    <dd className="type-mono mt-1 text-xs">
                      {latestPayment?.status || 'NONE'}
                    </dd>
                  </div>
                  <div>
                    <dt className="eyebrow">Scenario</dt>
                    <dd className="type-mono mt-1 text-xs">
                      {latestPayment?.scenario || '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="eyebrow">Attempts</dt>
                    <dd className="type-mono mt-1 text-xs">
                      {order.payments.length}
                    </dd>
                  </div>
                  <div>
                    <dt className="eyebrow">eSIMs issued</dt>
                    <dd className="type-mono mt-1 text-xs">
                      {order._count.esims} of {order.items.length}
                    </dd>
                  </div>
                </dl>

                {order.failureReason && (
                  <p className="mt-4 rounded-xl border border-[var(--z-error)] px-4 py-3 text-sm text-[var(--z-error)]">
                    {order.failureReason}
                  </p>
                )}

                {events.length > 0 && (
                  <details className="faq-item mt-4 border-t border-[var(--z-line)] pt-4">
                    <summary className="flex items-center justify-between text-sm">
                      <span>
                        Payment events ({events.length}) — every callback
                        received
                      </span>
                      <span aria-hidden="true" className="faq-icon type-mono text-lg">
                        +
                      </span>
                    </summary>
                    <ul className="mt-4 space-y-2">
                      {events.map((event) => (
                        <li
                          key={event.id}
                          className="type-mono flex flex-wrap justify-between gap-2 rounded-lg bg-[var(--z-mist)] px-3 py-2 text-xs"
                        >
                          <span className="break-all">{event.eventId}</span>
                          <span>{event.type}</span>
                          <span className="text-[var(--z-ink-soft)]">
                            {new Date(event.receivedAt).toLocaleTimeString('en-IE')}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 text-xs leading-relaxed text-[var(--z-ink-soft)]">
                      Each event id is stored under a unique constraint. A
                      repeated delivery is recognised and ignored rather than
                      processed twice.
                    </p>
                  </details>
                )}

                <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
                  <AdminOrderActions
                    orderId={order.id}
                    status={order.status}
                    hasEvents={events.length > 0}
                  />
                  <Link
                    href={`/order/${order.id}`}
                    className="text-sm underline underline-offset-4"
                  >
                    View customer receipt
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
