import LegalPage from '@/components/LegalPage';

export const metadata = {
  title: 'Privacy policy — Zelvoya',
  description: 'What personal data Zelvoya collects, why, and your rights over it.',
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy" updated="August 2026">
      <p>
        Zelvoya Ltd (HE 480221, 12 Stasikratous Street, 1065 Nicosia, Cyprus) is
        the controller of the personal data described here. This page explains
        what we collect, why we hold it, and what you can ask us to do with it.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Your name and email address</strong>, which you give us at
          checkout so we can deliver your eSIM and send your receipt.
        </li>
        <li>
          <strong>Order records</strong> — which plans you bought, what you
          paid, the state of each order, and the activation details of any eSIM
          issued to you.
        </li>
        <li>
          <strong>Account details</strong> if you have an account: your email
          and a hashed password. We never store your password itself.
        </li>
      </ul>

      <h2>What we do not collect</h2>
      <p>
        <strong>We never see or store your card details.</strong> Payment is
        handled entirely by our payment provider; card data does not pass
        through our systems and no card fields exist anywhere on this site.
      </p>
      <p>
        We do not collect your browsing history, your location, or any data
        about how you use the mobile connection your eSIM provides. We cannot
        see the sites you visit or the traffic you send.
      </p>

      <h2>Why we hold it</h2>
      <p>
        We process your name, email and order records to perform the contract
        you entered into when you bought a plan — delivering the eSIM, providing
        support, and handling refunds. We keep order and payment records to meet
        accounting and tax obligations under Cypriot law.
      </p>

      <h2>Who we share it with</h2>
      <p>
        We share the minimum necessary with the parties who help us run the
        service: our hosting and database providers, our payment provider, and
        the network partners who issue eSIMs. Each acts on our instructions and
        may not use your data for their own purposes.
      </p>
      <p>
        We do not sell personal data, and we do not share it for advertising.
      </p>

      <h2>How long we keep it</h2>
      <p>
        Order and payment records are kept for seven years to satisfy accounting
        requirements. Account details are kept while your account is open and
        deleted within 30 days of closure, except where a record must be
        retained for the period above.
      </p>

      <h2>Your rights</h2>
      <p>
        Under the GDPR you can ask us for a copy of the data we hold about you,
        ask us to correct it, ask us to delete it where we have no obligation to
        keep it, object to processing, or ask for your data in a portable
        format.
      </p>
      <p>
        Write to privacy@zelvoya.com and we will respond within one month. If
        you are not satisfied with our answer, you can complain to the Office of
        the Commissioner for Personal Data Protection in Cyprus, or to the
        supervisory authority in your own country.
      </p>

      <h2>Cookies</h2>
      <p>
        We use two cookies, both necessary for the site to work: one remembers
        the contents of your cart, and one keeps you signed in. Neither is used
        for tracking or advertising, and we do not run analytics that identify
        you.
      </p>

      <h2>Security</h2>
      <p>
        Data is transmitted over encrypted connections and stored in a database
        that is not publicly reachable. Passwords are stored as bcrypt hashes.
        Access to production data is limited to staff who need it.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this policy: privacy@zelvoya.com, or write to us at the
        address above.
      </p>
    </LegalPage>
  );
}
