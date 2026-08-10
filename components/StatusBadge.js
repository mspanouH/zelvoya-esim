/**
 * One place that decides how every order state is presented.
 *
 * Keeping the label and colour here means the receipt, the account page and the
 * admin table can never disagree about what FULFILMENT_FAILED looks like.
 */

const STATES = {
  CREATED: { label: 'Awaiting payment', tone: 'neutral' },
  PENDING_PAYMENT: { label: 'Payment in progress', tone: 'neutral' },
  PAID: { label: 'Paid', tone: 'positive' },
  PROVISIONING: { label: 'Preparing your eSIM', tone: 'neutral' },
  FULFILLED: { label: 'Delivered', tone: 'positive' },
  PAYMENT_DECLINED: { label: 'Payment declined', tone: 'negative' },
  PAYMENT_TIMEOUT: { label: 'Payment timed out', tone: 'negative' },
  FULFILMENT_FAILED: { label: 'Preparing your eSIM', tone: 'warning' },
};

const TONES = {
  neutral: 'border-[var(--z-line)] text-[var(--z-ink-soft)]',
  positive: 'border-[var(--z-pine)] text-[var(--z-pine)]',
  warning: 'border-[var(--z-signal)] text-[#8a6410]',
  negative: 'border-[var(--z-error)] text-[var(--z-error)]',
};

export default function StatusBadge({ status, adminLabel = false }) {
  const state = STATES[status] || { label: status, tone: 'neutral' };

  // Admin needs the real state name; customers get the reassuring version.
  const label = adminLabel ? status : state.label;

  return (
    <span
      className={`type-mono inline-block rounded-full border px-3 py-1 text-xs uppercase tracking-widest ${TONES[state.tone]}`}
    >
      {label}
    </span>
  );
}
