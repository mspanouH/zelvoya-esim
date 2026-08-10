import Link from 'next/link';
import CheckoutForm from '@/components/CheckoutForm';
import { readCart } from '@/lib/cart';
import { getPlanBySlug } from '@/lib/providers/esim-provider';
import { formatPrice } from '@/lib/format';
import { getSessionUser } from '@/lib/auth';

export const metadata = { title: 'Checkout — Zelvoya' };

export default async function CheckoutPage() {
  const slugs = await readCart();
  const user = await getSessionUser();

  const lines = [];
  for (const slug of slugs) {
    const plan = await getPlanBySlug(slug);
    if (plan) lines.push(plan);
  }

  const totalCents = lines.reduce((sum, plan) => sum + plan.priceCents, 0);

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-24 text-center sm:px-8">
        <h1 className="type-display text-4xl">Nothing to check out</h1>
        <p className="mt-4 text-[15px] text-[var(--z-ink-soft)]">
          Your cart is empty. Choose a destination and you can be connected in
          minutes.
        </p>
        <Link href="/#destinations" className="btn btn-primary mt-8 px-7 py-4">
          Browse destinations
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
      <h1 className="type-display text-4xl sm:text-5xl">Checkout</h1>
      <p className="mt-3 text-[15px] text-[var(--z-ink-soft)]">
        Two details and you are done. Payment happens on the next step.
      </p>

      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
        <section aria-labelledby="details-heading">
          <h2 id="details-heading" className="type-display text-2xl">
            Your details
          </h2>
          <div className="mt-6">
            <CheckoutForm defaultEmail={user?.email} defaultName={user?.name}/>
          </div>
        </section>

        <aside aria-labelledby="summary-heading">
          <h2 id="summary-heading" className="type-display text-2xl">
            Order summary
          </h2>

          <ul className="mt-6 divide-y divide-[var(--z-line)] border-y border-[var(--z-line)]">
            {lines.map((plan, index) => (
              <li
                key={`${plan.slug}-${index}`}
                className="flex items-start justify-between gap-4 py-4"
              >
                <div>
                  <p className="text-[15px]">{plan.destination} eSIM</p>
                  <p className="type-mono mt-1 text-xs uppercase tracking-[0.14em] text-[var(--z-ink-soft)]">
                    {plan.dataGb} GB · {plan.validityDays} days
                  </p>
                </div>
                <p className="text-[15px]">
                  {formatPrice(plan.priceCents, plan.currency)}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-5 flex justify-between">
            <p className="type-display text-xl">Total</p>
            <p className="type-display text-xl">{formatPrice(totalCents)}</p>
          </div>
          <p className="mt-1 text-xs text-[var(--z-ink-soft)]">
            VAT included where applicable. One-off payment, no subscription.
          </p>

          <Link
            href="/cart"
            className="mt-6 inline-block text-sm text-[var(--z-ink-soft)] underline underline-offset-4 hover:text-[var(--z-ink)]"
          >
            Edit cart
          </Link>
        </aside>
      </div>
    </div>
  );
}
