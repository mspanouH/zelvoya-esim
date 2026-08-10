import Link from 'next/link';

export const metadata = {
  title: 'Contact us — Zelvoya',
  description: 'How to reach Zelvoya support, and our company details.',
};

const CHANNELS = [
  {
    title: 'Support',
    detail: 'support@zelvoya.com',
    body: 'Installation problems, connection trouble, or anything about an order you have already placed. Include your order reference and we can look it up straight away.',
    response: 'Within one working day',
  },
  {
    title: 'Before you buy',
    detail: 'hello@zelvoya.com',
    body: 'Not sure whether your phone supports eSIM, or which plan suits your trip? Ask before you order rather than after.',
    response: 'Within one working day',
  },
  {
    title: 'Billing and refunds',
    detail: 'billing@zelvoya.com',
    body: 'Receipts, VAT invoices and refund requests. See our refund policy first — it covers most cases.',
    response: 'Within two working days',
  },
  {
    title: 'Privacy',
    detail: 'privacy@zelvoya.com',
    body: 'Requests about the personal data we hold, including access, correction and deletion.',
    response: 'Within one month',
  },
];

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
      <p className="eyebrow">Support</p>
      <h1 className="type-display mt-3 text-4xl sm:text-5xl">
        Talk to a person.
      </h1>
      <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-[var(--z-ink-soft)]">
        Real people answer these, in Cyprus, seven days a week. If you are
        travelling and something is not working, say so in the subject line and
        we will move you up the queue.
      </p>

      <section aria-labelledby="channels-heading" className="mt-14">
        <h2 id="channels-heading" className="type-display text-3xl">
          Where to write
        </h2>

        <ul className="mt-8 grid gap-6 sm:grid-cols-2">
          {CHANNELS.map((channel) => (
            <li
              key={channel.title}
              className="rounded-2xl border border-[var(--z-line)] p-6"
            >
              <h3 className="type-display text-xl">{channel.title}</h3>
              <p className="type-mono mt-2 break-all text-sm text-[var(--z-pine)]">
                {channel.detail}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[var(--z-ink-soft)]">
                {channel.body}
              </p>
              <p className="eyebrow mt-4">{channel.response}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="company-heading" className="mt-16">
        <h2 id="company-heading" className="type-display text-3xl">
          Company details
        </h2>

        <dl className="mt-8 grid gap-x-8 gap-y-6 border-t border-[var(--z-line)] pt-8 sm:grid-cols-2">
          <div>
            <dt className="eyebrow">Registered name</dt>
            <dd className="mt-1 text-[15px]">Zelvoya Ltd</dd>
          </div>
          <div>
            <dt className="eyebrow">Company number</dt>
            <dd className="type-mono mt-1 text-sm">HE 480221</dd>
          </div>
          <div>
            <dt className="eyebrow">Registered address</dt>
            <dd className="mt-1 text-[15px]">
              12 Stasikratous Street
              <br />
              1065 Nicosia
              <br />
              Cyprus
            </dd>
          </div>
          <div>
            <dt className="eyebrow">VAT number</dt>
            <dd className="type-mono mt-1 text-sm">CY 10480221P</dd>
          </div>
          <div>
            <dt className="eyebrow">Telephone</dt>
            <dd className="type-mono mt-1 text-sm">+357 22 000 000</dd>
          </div>
          <div>
            <dt className="eyebrow">Support hours</dt>
            <dd className="mt-1 text-[15px]">
              Monday to Sunday, 08:00–20:00 EET
            </dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="before-heading" className="mt-16">
        <h2 id="before-heading" className="type-display text-3xl">
          Faster than emailing
        </h2>
        <ul className="mt-6 space-y-3 text-[15px] leading-relaxed text-[var(--z-ink-soft)]">
          <li>
            Your QR code, ICCID and activation details are in{' '}
            <Link
              href="/account"
              className="text-[var(--z-ink)] underline underline-offset-4"
            >
              your account
            </Link>{' '}
            as soon as payment is confirmed.
          </li>
          <li>
            Installation steps and device requirements are on every{' '}
            <Link
              href="/#destinations"
              className="text-[var(--z-ink)] underline underline-offset-4"
            >
              plan page
            </Link>
            .
          </li>
          <li>
            Refund questions are usually answered by the{' '}
            <Link
              href="/refund-policy"
              className="text-[var(--z-ink)] underline underline-offset-4"
            >
              refund policy
            </Link>
            .
          </li>
        </ul>
      </section>
    </div>
  );
}
