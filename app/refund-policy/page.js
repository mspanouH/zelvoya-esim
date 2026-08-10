import Link from 'next/link';
import LegalPage from '@/components/LegalPage';

export const metadata = {
  title: 'Refund policy — Zelvoya',
  description: 'When a Zelvoya eSIM can be refunded, and how to request one.',
};

export default function RefundPolicyPage() {
  return (
    <LegalPage title="Refund policy" updated="August 2026">
      <p>
        A travel eSIM is a digital product, and once it has been installed and
        connected to a network it cannot be returned. This page sets out exactly
        when we will refund, and how to ask.
      </p>

      <h2>When you can get a full refund</h2>
      <ul>
        <li>
          <strong>The eSIM has not been installed.</strong> Ask within 30 days
          of purchase and we will refund in full, no reason needed.
        </li>
        <li>
          <strong>Your device turned out to be incompatible</strong>, provided
          the eSIM has not been installed successfully on another device.
        </li>
        <li>
          <strong>The eSIM does not work.</strong> If it cannot be installed or
          will not connect in the destination, and support cannot resolve it, we
          refund in full.
        </li>
        <li>
          <strong>We charged you twice for the same order.</strong> Tell us and
          we will return the duplicate, usually the same day.
        </li>
      </ul>

      <h2>When we cannot refund</h2>
      <ul>
        <li>
          The eSIM has been installed and has connected to a network. At that
          point the plan is in use and the allowance has been allocated to you.
        </li>
        <li>
          The validity period has expired, whether or not the data was used.
        </li>
        <li>
          Your trip was cancelled or your plans changed after installation.
        </li>
        <li>
          Coverage was poorer than you hoped in a particular location. Mobile
          coverage varies, and we cannot guarantee signal at a specific address.
        </li>
        <li>
          The data allowance ran out sooner than you expected. Plans do not
          charge overage — the connection simply stops, and you can buy another.
        </li>
      </ul>

      <h2>Partial refunds</h2>
      <p>
        Where a plan was interrupted by a fault on our side or our partner
        network, we may refund the unused portion of the validity period rather
        than the whole plan. We will tell you what we are proposing before we
        process anything.
      </p>

      <h2>How to request a refund</h2>
      <p>
        Email support@zelvoya.com with your order reference — it looks like
        ZV-K7M2QX and appears on your order page and in your account. Tell us
        what happened and whether you managed to install the eSIM.
      </p>
      <p>
        We aim to answer within one working day. Approved refunds are returned
        to the original payment method and usually appear within 5–10 working
        days, depending on your bank.
      </p>

      <h2>If your order failed</h2>
      <p>
        If a payment was declined or timed out, nothing was charged and there is
        nothing to refund — your order is kept so you can try again from your
        order page.
      </p>
      <p>
        If your payment succeeded but your eSIM has not arrived, no refund is
        needed yet: your order is safe and our team is notified automatically.
        Contact us if it has not appeared within a few hours.
      </p>

      <h2>Your statutory rights</h2>
      <p>
        Nothing here limits the rights you have under EU consumer law. Note that
        the usual 14-day withdrawal right for digital content ends once delivery
        has begun with your consent, which is why an installed and activated
        eSIM cannot be returned.
      </p>

      <p>
        Questions before you buy?{' '}
        <Link
          href="/contact"
          className="text-[var(--z-ink)] underline underline-offset-4"
        >
          Talk to support
        </Link>{' '}
        — we would rather help you pick the right plan than refund the wrong
        one.
      </p>
    </LegalPage>
  );
}
