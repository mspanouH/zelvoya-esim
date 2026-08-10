import Link from 'next/link';
import Image from 'next/image';
import { readCart } from '@/lib/cart';
import { getPlanBySlug } from '@/lib/providers/esim-provider';
import { formatPrice } from '@/lib/format';
import RemoveFromCartButton from '@/components/RemoveFromCartButton';

export const metadata = { title: 'Your cart — Zelvoya' };

export default async function CartPage() {
  const slugs = await readCart();

  // Fetch each line's plan. Slugs can repeat — each entry is its own eSIM.
  const lines = [];
  for (const [index, slug] of slugs.entries()) {
    const plan = await getPlanBySlug(slug);
    if (plan) lines.push({ index, plan });
  }

  const totalCents = lines.reduce((sum, line) => sum + line.plan.priceCents, 0);

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-24 text-center sm:px-8">
        <h1 className="type-display text-4xl">Your cart is empty</h1>
        <p className="mt-4 text-[15px] text-[var(--z-ink-soft)]">
          Pick a destination and your eSIM will be ready before you land.
        </p>
        <Link href="/#destinations" className="btn btn-primary mt-8 px-7 py-4">
          Browse destinations
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
      <h1 className="type-display text-4xl sm:text-5xl">Your cart</h1>

      <div className="mt-10 grid gap-12 lg:grid-cols-[1.6fr_1fr]">
        <ul className="divide-y divide-[var(--z-line)] border-y border-[var(--z-line)]">
          {lines.map((line) => (
            <li key={line.index} className="flex gap-5 py-6">
              <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-lg">
                <Image
                  src={line.plan.image}
                  alt={line.plan.imageAlt}
                  fill
                  sizes="128px"
                  className="object-cover"
                />
              </div>

              <div className="flex flex-1 flex-col">
                <h2 className="type-display text-xl">
                  {line.plan.destination} eSIM
                </h2>
                <p className="type-mono mt-1 text-xs uppercase tracking-[0.14em] text-[var(--z-ink-soft)]">
                  {line.plan.dataGb} GB · {line.plan.validityDays} days ·{' '}
                  {line.plan.network}
                </p>
                <div className="mt-auto pt-3">
                  <RemoveFromCartButton
                    index={line.index}
                    destination={line.plan.destination}
                  />
                </div>
              </div>

              <p className="type-display text-xl">
                {formatPrice(line.plan.priceCents, line.plan.currency)}
              </p>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-2xl border border-[var(--z-line)] p-6">
          <h2 className="eyebrow">Order summary</h2>

          <dl className="mt-5 space-y-3 text-[15px]">
            <div className="flex justify-between">
              <dt className="text-[var(--z-ink-soft)]">
                {lines.length} {lines.length === 1 ? 'eSIM' : 'eSIMs'}
              </dt>
              <dd>{formatPrice(totalCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--z-ink-soft)]">Delivery</dt>
              <dd>Instant, by QR code</dd>
            </div>
          </dl>

          <div className="mt-5 flex justify-between border-t border-[var(--z-line)] pt-5">
            <p className="type-display text-xl">Total</p>
            <p className="type-display text-xl">{formatPrice(totalCents)}</p>
          </div>
          <p className="mt-1 text-xs text-[var(--z-ink-soft)]">
            VAT included where applicable.
          </p>

          <Link href="/checkout" className="btn btn-primary mt-6 w-full px-7 py-4">
            Continue to checkout
          </Link>
        </aside>
      </div>
    </div>
  );
}