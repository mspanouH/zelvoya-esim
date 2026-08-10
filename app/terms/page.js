import LegalPage from '@/components/LegalPage';

export const metadata = {
  title: 'Terms & conditions — Zelvoya',
  description: 'The terms that apply when you buy a travel eSIM from Zelvoya.',
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms & conditions" updated="August 2026">
      <p>
        These terms apply when you buy a travel eSIM from Zelvoya Ltd, a company
        registered in Cyprus (HE 480221) at 12 Stasikratous Street, 1065
        Nicosia. Placing an order means you accept them.
      </p>

      <h2>What we sell</h2>
      <p>
        Zelvoya sells prepaid, data-only eSIM plans for use abroad. Each plan
        lists its destination, data allowance, validity period and network type
        before purchase. Plans do not include calls or SMS, and do not provide a
        phone number.
      </p>
      <p>
        We buy capacity from mobile network partners in each destination. We are
        a reseller, not a network operator, and coverage and speeds are
        determined by the local networks available to you.
      </p>

      <h2>Your device</h2>
      <p>
        You are responsible for checking that your device supports eSIM and is
        not locked to a carrier before you buy. Most phones released from 2019
        onwards support eSIM, but a carrier-locked device cannot install one. We
        cannot issue a refund for a plan that has been installed on an
        incompatible or locked device.
      </p>

      <h2>Orders and payment</h2>
      <p>
        Prices are shown in euro and include VAT where it applies. An order is
        confirmed only once payment has been settled by our payment provider,
        not when you submit the checkout form. If payment is declined or does
        not complete, your order is kept so that you can try again, and nothing
        is charged.
      </p>

      <h2>Delivery and activation</h2>
      <p>
        Your eSIM is delivered electronically. Once payment is confirmed, a QR
        code and activation details appear in your account and on your order
        page, normally within a minute.
      </p>
      <p>
        <strong>
          The validity period begins when the eSIM first connects to a network
          in the destination, not when you buy or install it.
        </strong>{' '}
        You can install a plan in advance and it will remain dormant until you
        arrive.
      </p>
      <p>
        A plan ends when its data allowance is used or its validity period
        expires, whichever comes first. Unused data is not carried over and
        allowances are not topped up automatically. Plans do not renew.
      </p>

      <h2>Fair use</h2>
      <p>
        Plans are intended for personal travel use. We may suspend or terminate
        a plan used for commercial redistribution, permanent roaming outside the
        purchased destination, or any unlawful purpose.
      </p>

      <h2>If something goes wrong</h2>
      <p>
        If your eSIM cannot be installed or does not connect, contact support
        and we will investigate. Where a fault is ours or our network partner
        can be shown to be at fault, we will replace the plan or refund it.
      </p>
      <p>
        We are not liable for indirect or consequential losses arising from loss
        of connectivity, including missed bookings or business interruption. Our
        total liability for any order is limited to the amount you paid for it.
        Nothing in these terms limits liability that cannot be limited by law.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms. The version that applies to your order is the
        one published when you placed it. Material changes will be announced on
        this page.
      </p>

      <h2>Governing law</h2>
      <p>
        These terms are governed by the laws of the Republic of Cyprus, and the
        courts of Cyprus have jurisdiction. If you are a consumer in the EU,
        this does not remove protections available to you under the law of your
        own country.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms: support@zelvoya.com, or write to Zelvoya
        Ltd, 12 Stasikratous Street, 1065 Nicosia, Cyprus.
      </p>
    </LegalPage>
  );
}
