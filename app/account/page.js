import Link from 'next/link';
import { redirect } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';
import EsimCard from '@/components/EsimCard';
import LogoutButton from '@/components/LogoutButton';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatPrice } from '@/lib/format';

export const metadata = { title: 'Your account — Zelvoya' };

export default async function AccountPage() {
  const user = await getSessionUser();

  if (!user) redirect('/login?next=/account');

  /**
   * Orders are matched by email, not by userId.
   *
   * Checkout is available to guests, so an order placed without signing in has
   * no userId. Matching on email means those orders still appear here when the
   * customer signs in with the same address.
   */
  const orders = await prisma.order.findMany({
    where: {
      OR: [{ email: user.email }, { userId: user.id }],},
    include: {
      items: { include: { esim: true } },
      esims: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const fulfilledEsims = orders
    .filter((order) => order.status === 'FULFILLED')
    .flatMap((order) =>
      order.items
        .filter((item) => item.esim)
        .map((item) => ({ esim: item.esim, destination: item.destination }))
    );

  return (
    <div className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Account</p>
          <h1 className="type-display mt-3 text-4xl sm:text-5xl">
            {user.name || 'Your account'}
          </h1>
          <p className="mt-2 text-[15px] text-[var(--z-ink-soft)]">
            {user.email}
          </p>
        </div>
        <div className="flex gap-3">
          {user.role === 'ADMIN' && (
            <Link href="/admin/orders" className="btn btn-secondary px-5 py-2.5">
              Admin
            </Link>
          )}
          <LogoutButton />
        </div>
      </div>

      <section aria-labelledby="esims-heading" className="mt-16">
        <h2 id="esims-heading" className="type-display text-3xl">
          My eSIMs
        </h2>

        {fulfilledEsims.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-[var(--z-line)] px-6 py-14 text-center">
            <p className="type-display text-2xl">No eSIMs yet</p>
            <p className="mt-2 text-sm text-[var(--z-ink-soft)]">
              Your QR codes and activation details will appear here as soon as
              an order is delivered.
            </p>
            <Link
              href="/#destinations"
              className="btn btn-primary mt-6 px-6 py-3"
            >
              Browse destinations
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {fulfilledEsims.map(({ esim, destination }) => (
              <EsimCard key={esim.id} esim={esim} destination={destination} />
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="orders-heading" className="mt-16">
        <h2 id="orders-heading" className="type-display text-3xl">
          Order history
        </h2>

        {orders.length === 0 ? (
          <p className="mt-6 text-[15px] text-[var(--z-ink-soft)]">
            You have not placed an order yet.
          </p>
        ) : (
          <ul className="mt-6 divide-y divide-[var(--z-line)] border-y border-[var(--z-line)]">
            {orders.map((order) => (
              <li
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-4 py-5"
              >
                <div>
                  <p className="type-mono text-sm">{order.reference}</p>
                  <p className="mt-1 text-sm text-[var(--z-ink-soft)]">
                    {order.items.map((item) => item.destination).join(', ')} ·{' '}
                    {new Date(order.createdAt).toLocaleDateString('en-IE', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <StatusBadge status={order.status} />
                  <p className="text-[15px]">
                    {formatPrice(order.totalCents, order.currency)}
                  </p>
                  <Link
                    href={`/order/${order.id}`}
                    className="text-sm underline underline-offset-4"
                  >
                    View
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
