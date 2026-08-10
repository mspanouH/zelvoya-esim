import Image from 'next/image';
import Link from 'next/link';
import DestinationBrowser from '@/components/DestinationBrowser';
import Faq from '@/components/Faq';
import { getPlans, formatPrice } from '@/lib/catalog';

const STEPS = [
  {
    number: '01',
    title: 'Choose your destination',
    body: 'Pick the country you are travelling to and the amount of data you need. Every plan shows its allowance, validity and network before you buy.',
  },
  {
    number: '02',
    title: 'Pay and get your QR code',
    body: 'Checkout takes a minute. As soon as your payment is confirmed, your eSIM is issued and the QR code appears in your account.',
  },
  {
    number: '03',
    title: 'Scan and land connected',
    body: 'Scan the code in your phone settings before you fly. Your plan activates when you arrive and connects to a local network automatically.',
  },
];

const BENEFITS = [
  {
    title: 'Instant activation',
    body: 'Delivered in minutes, not days. Install before you fly.',
  },
  {
    title: '4G and 5G speeds',
    body: 'Local networks at local speeds, wherever coverage reaches.',
  },
  {
    title: 'No physical SIM',
    body: 'Nothing to post, swap or lose at the airport.',
  },
  {
    title: 'Easy installation',
    body: 'One QR code and two taps in your phone settings.',
  },
  {
    title: 'Real support',
    body: 'People who answer, in your timezone, before and during your trip.',
  },
];

export default function HomePage() {
  const plans = getPlans();
  const boardPlans = plans.slice(0, 3);

  return (
    <>
      {/* ---------------------------------------------------------------- Hero */}
      <section className="relative isolate overflow-hidden bg-[var(--z-pine-deep)]">
        <Image
          src="/hero.jpg"
          alt="Distant mountain ridges at sunrise seen from a high viewpoint"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--z-pine-deep)] via-[var(--z-pine-deep)]/55 to-transparent" />

        <div className="relative mx-auto flex min-h-[85vh] max-w-6xl flex-col justify-end px-5 pb-12 pt-28 sm:px-8 sm:pb-16">
          <p className="eyebrow text-white/70">Travel eSIMs · 190+ countries</p>
          <h1 className="type-display mt-5 max-w-3xl text-[3.25rem] leading-[0.95] text-white sm:text-7xl lg:text-8xl">
            Go further.
            <br />
            Stay connected.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/80">
            Instant travel eSIMs for wherever you are headed. Buy in minutes,
            scan one QR code, and arrive already online.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="#destinations" className="btn btn-invert px-7 py-4">
              Browse destinations
            </Link>
            <Link
              href="#how-it-works"
              className="btn btn-outline-invert px-7 py-4"
            >
              How it works
            </Link>
          </div>

          {/* Departure-board strip: real catalogue data, mono treatment. */}
          <ul className="mt-14 grid gap-px overflow-hidden rounded-xl border border-white/15 bg-white/15 sm:grid-cols-3">
            {boardPlans.map((plan) => (
              <li
                key={plan.slug}
                className="bg-[var(--z-pine-deep)]/80 px-5 py-4 backdrop-blur"
              >
                <Link href={`/esim/${plan.slug}`} className="block">
                  <p className="type-mono flex items-center justify-between text-xs uppercase tracking-[0.16em] text-white/60">
                    <span>{plan.countryCode}</span>
                    <span>
                      {plan.dataGb} GB / {plan.validityDays}D
                    </span>
                  </p>
                  <p className="mt-2 flex items-baseline justify-between gap-3 text-white">
                    <span className="type-display text-xl">
                      {plan.destination}
                    </span>
                    <span className="type-mono text-sm text-[var(--z-signal)]">
                      {formatPrice(plan.priceCents, plan.currency)}
                    </span>
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* -------------------------------------------------------- Destinations */}
      <section
        id="destinations"
        className="mx-auto max-w-6xl scroll-mt-20 px-5 py-24 sm:px-8 sm:py-28"
      >
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Popular right now</p>
          <h2 className="type-display mt-4 text-4xl sm:text-5xl">
            Where are you going?
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-[var(--z-ink-soft)]">
            Every plan is data-only, activates on arrival and works alongside
            the SIM you already have.
          </p>
        </div>

        <div className="mt-12">
          <DestinationBrowser plans={plans} />
        </div>
      </section>

      {/* ------------------------------------------------------- How it works */}
      <section
        id="how-it-works"
        className="scroll-mt-20 border-y border-[var(--z-line)] bg-[var(--z-mist)]"
      >
        <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-28">
          <p className="eyebrow">How it works</p>
          <h2 className="type-display mt-4 max-w-xl text-4xl sm:text-5xl">
            Three steps between booking and boarding.
          </h2>

          <ol className="mt-16 grid gap-12 md:grid-cols-3">
            {STEPS.map((step) => (
              <li key={step.number}>
                <p className="type-mono text-sm text-[var(--z-signal)]">
                  {step.number}
                </p>
                <h3 className="type-display mt-4 border-t border-[var(--z-line)] pt-4 text-2xl">
                  {step.title}
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-[var(--z-ink-soft)]">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ----------------------------------------------------------- Benefits */}
      <section className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-28">
        <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div>
            <p className="eyebrow">Why Zelvoya</p>
            <h2 className="type-display mt-4 text-4xl sm:text-5xl">
              Built for the way people actually travel.
            </h2>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-[var(--z-ink-soft)]">
              No queues at an airport kiosk, no swapping tiny plastic trays over
              a bathroom sink, no bill shock when you get home.
            </p>
            <div className="relative mt-10 aspect-[16/10] overflow-hidden rounded-2xl">
              <Image
                src="/destinations/thailand.jpg"
                alt="Coastal headlands under a bright hazy sky"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
              />
            </div>
          </div>

          <ul className="divide-y divide-[var(--z-line)] border-t border-[var(--z-line)]">
            {BENEFITS.map((benefit) => (
              <li key={benefit.title} className="py-7">
                <h3 className="type-display text-2xl">{benefit.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[var(--z-ink-soft)]">
                  {benefit.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------------------------------------------------------------- FAQ */}
      <section
        id="faq"
        className="scroll-mt-20 border-t border-[var(--z-line)] bg-[var(--z-mist)]"
      >
        <div className="mx-auto max-w-4xl px-5 py-24 sm:px-8 sm:py-28">
          <p className="eyebrow">Questions</p>
          <h2 className="type-display mt-4 text-4xl sm:text-5xl">
            Before you buy.
          </h2>
          <Faq />
          <p className="mt-10 text-[15px] text-[var(--z-ink-soft)]">
            Still unsure?{' '}
            <Link href="/contact" className="text-[var(--z-ink)] underline underline-offset-4">
              Talk to our support team
            </Link>
            .
          </p>
        </div>
      </section>

      {/* ---------------------------------------------------------- Closing CTA */}
      <section className="bg-[var(--z-pine)]">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-8 px-5 py-20 sm:px-8 md:flex-row md:items-center md:justify-between">
          <h2 className="type-display max-w-xl text-4xl text-white sm:text-5xl">
            Your next trip is already connected.
          </h2>
          <Link href="#destinations" className="btn btn-invert px-7 py-4">
            Choose a destination
          </Link>
        </div>
      </section>
    </>
  );
}
