'use client';

import { useActionState } from 'react';
import {
  retryFulfilmentAction,
  replayLastEventAction,
} from '@/lib/actions/admin';

const initialState = { message: null, error: null };

function ActionButton({ action, orderId, label, pendingLabel, variant }) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="inline-block">
      <input type="hidden" name="orderId" value={orderId} />
      <button
        type="submit"
        disabled={isPending}
        className={`btn ${variant} px-4 py-2.5 text-sm disabled:opacity-60`}
      >
        {isPending ? pendingLabel : label}
      </button>

      {(state.message || state.error) && (
        <p
          role="status"
          className={`mt-2 max-w-xs text-xs leading-relaxed ${
            state.error ? 'text-[var(--z-error)]' : 'text-[var(--z-pine)]'
          }`}
        >
          {state.error || state.message}
        </p>
      )}
    </form>
  );
}

export default function AdminOrderActions({ orderId, status, hasEvents }) {
  return (
    <div className="flex flex-wrap items-start gap-3">
      {status === 'FULFILMENT_FAILED' && (
        <ActionButton
          action={retryFulfilmentAction}
          orderId={orderId}
          label="Retry fulfilment"
          pendingLabel="Retrying…"
          variant="btn-primary"
        />
      )}

{hasEvents && (
  <div className="w-full rounded-xl border border-dashed border-[var(--z-line)] p-4">
    <p className="eyebrow">Demonstration control</p>
    <p className="mt-2 max-w-md text-xs leading-relaxed text-[var(--z-ink-soft)]">
      Payment providers deliver each notification more than once when they do
      not receive a prompt acknowledgement. This resends the last one unchanged.
      Expected result: the endpoint reports it was already handled, and no
      second eSIM is issued.
    </p>
    <div className="mt-3">
        <ActionButton
          action={replayLastEventAction}
          orderId={orderId}
          label="Resend this payment notification"
          pendingLabel="Replaying…"
          variant="btn-secondary"
        />
        </div>
  </div>
)}
    </div>
  );
} 
