import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AddToCartButton from '@/components/AddToCartButton';
import { getPlanBySlug } from '@/lib/providers/esim-provider';
import { formatPrice } from '@/lib/format';

/**
 * Dynamic route: app/esim/[slug]/page.js serves /esim/japan, /esim/cyprus, etc.
 *
 * In Next 16 `params` is a Promise and must be awaited.
 */

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const plan = await getPlanBySlug(slug);

  if (!plan) return { title: 'Plan not found — Zelvoya' };

  return {
    title: `${plan.destination} eSIM — ${plan.dataGb} GB for ${plan.validityDays} days | Zelvoya`,
    description: `${plan.dataGb} GB of ${plan.network} data in ${plan.destination}, valid ${plan.validityDays} days. Delivered instantly by QR code.`,
  };
}

const SPECS = [
  { label: 'Destination', get: (p) => p.destination },
  { label: 'Data', get: (p) => `${p.dataGb} GB` },
  { label: 'Validity', get: (p) => `${p.validityDays} days` },
  { label: 'Network', get: (p) => p.network },
  { label: 'Type', get: () => 'Data only' },
  { label: 'Activation', get: () => 'QR code, instant' },
];

const INSTALL_STEPS = [
  'Buy your plan and open your account. The QR code appears as soon as payment is confirmed.',
  'On your phone, open Settings → Mobile Data → Add eSIM, and scan the code.',
  'Label the plan so you can recognise it later, and keep your home line as the default for calls.',
  'On arrival, switch mobile data to your Zelvoya line. It connects to a local network automatically.',
];

export default async function PlanPage({ params }) {
  const { slug } = await params;
  const plan = await getPlanBySlug(slug);

  // A slug that does not exist must be a real 404, not an empty page: it tells
  // the browser and search engines the product genuinely is not there.
  if (!plan) notFound();

  return (
    <article className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
      <nav aria-label="Breadcrumb" className="eyebrow">
        <Link href="/" className="hover:text-[var(--z-ink)]">
          Destinations
        </Link>
        <span aria-hidden="true"> / </span>
        <span>{plan.destination}</span>
      </nav>

      <div className="mt-8 grid gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
          <Image
            src={plan.image}
            alt={plan.imageAlt}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
          <span className="type-mono absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1.5 text-xs tracking-widest">
            {plan.countryCode}
          </span>
        </div>

        <div>
          <h1 className="type-display text-4xl sm:text-5xl">
            {plan.destination} eSIM
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-[var(--z-ink-soft)]">
            {plan.tagline}
          </p>

          <p className="type-mono mt-8 border-y border-[var(--z-line)] py-4 text-xs uppercase tracking-[0.14em] text-[var(--z-ink-soft)]">
            {plan.dataGb} GB · {plan.validityDays} days · {plan.network}
          </p>

          <p className="type-display mt-8 text-5xl">
            {formatPrice(plan.priceCents, plan.currency)}
          </p>
          <p className="mt-1 text-sm text-[var(--z-ink-soft)]">
            One-off payment. No contract, no auto-renewal.
          </p>

          <div className="mt-8">
            <AddToCartButton slug={plan.slug} available={plan.available} />
          </div>

          <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-5">
            {SPECS.map((spec) => (
              <div key={spec.label}>
                <dt className="eyebrow">{spec.label}</dt>
                <dd className="mt-1 text-[15px]">{spec.get(plan)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <section className="mt-20 grid gap-12 border-t border-[var(--z-line)] pt-14 lg:grid-cols-2 lg:gap-16">
        <div>
          <h2 className="type-display text-3xl">Installing your eSIM</h2>
          <ol className="mt-6 space-y-5">
            {INSTALL_STEPS.map((step, index) => (
              <li key={step} className="flex gap-4">
                <span className="type-mono shrink-0 text-sm text-[var(--z-signal)]">
                  0{index + 1}
                </span>
                <p className="text-[15px] leading-relaxed text-[var(--z-ink-soft)]">
                  {step}
                </p>
              </li>
            ))}
          </ol>
        </div>

        <div>
          <h2 className="type-display text-3xl">Before you buy</h2>
          <div className="mt-6 space-y-5 text-[15px] leading-relaxed text-[var(--z-ink-soft)]">
            <p>
              Your phone needs to support eSIM and be carrier-unlocked. Most
              handsets released since 2019 qualify — check for an “Add eSIM”
              option in your mobile data settings.
            </p>
            <p>
              Validity starts when the eSIM first connects to a network in{' '}
              {plan.destination}, not when you buy it. Install before you fly.
            </p>
            <p>
              This is a data-only plan. Your usual number stays active for calls
              and texts on your home line.
            </p>
            <p>
              Need a hand?{' '}
              <Link
                href="/contact"
                className="text-[var(--z-ink)] underline underline-offset-4"
              >
                Talk to our support team
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </article>
  );
}
