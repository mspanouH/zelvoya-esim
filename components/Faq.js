const QUESTIONS = [
  {
    question: 'Will my phone work with an eSIM?',
    answer:
      'Most phones released since 2019 support eSIM, including iPhone XS and newer, Google Pixel 3 and newer, and recent Samsung Galaxy S and Z models. Your phone also needs to be carrier-unlocked. Check Settings for an "Add eSIM" or "Add mobile plan" option before you buy.',
  },
  {
    question: 'How quickly do I get my eSIM?',
    answer:
      'Your QR code appears in your account as soon as your payment is confirmed, usually within a minute. You can install it before you travel and it stays inactive until you arrive.',
  },
  {
    question: 'Do I keep my normal number?',
    answer:
      'Yes. A travel eSIM sits alongside your existing SIM, so you keep your number for calls and texts and use Zelvoya data abroad. Turn off roaming on your home line to avoid charges.',
  },
  {
    question: 'When does my plan start counting down?',
    answer:
      'Validity starts when the eSIM first connects to a network in your destination, not when you buy it. Install early, arrive, switch it on.',
  },
  {
    question: 'What happens if I run out of data?',
    answer:
      'Your connection stops rather than billing you for overage. You can buy another plan for the same destination at any time from your account.',
  },
  {
    question: 'Can I get a refund?',
    answer:
      'If your eSIM has not been installed and activated, you can request a full refund within 30 days. See our refund policy for the detail.',
  },
];

export default function Faq() {
  return (
    <ul className="mt-12 divide-y divide-[var(--z-line)] border-y border-[var(--z-line)]">
      {QUESTIONS.map((item) => (
        <li key={item.question}>
          <details className="faq-item group">
            <summary className="flex items-center justify-between gap-6 py-6">
              <span className="type-display text-xl sm:text-2xl">
                {item.question}
              </span>
              <span
                aria-hidden="true"
                className="faq-icon type-mono shrink-0 text-xl text-[var(--z-ink-soft)] transition-transform duration-200"
              >
                +
              </span>
            </summary>
            <p className="max-w-2xl pb-7 text-[15px] leading-relaxed text-[var(--z-ink-soft)]">
              {item.answer}
            </p>
          </details>
        </li>
      ))}
    </ul>
  );
}
