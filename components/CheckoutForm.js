'use client';

import { useActionState } from 'react';
import { createOrderAction } from '@/lib/actions/checkout';

const initialState = { errors: {}, values: {} };

/**
 * Client component because it shows validation errors and a pending state.
 *
  * useActionState wires a server action to a form. It returns:
  *   state      — whatever the action returned last time (our { error })
  *   formAction — pass to <form action={...}>
  *   isPending  — true while the action is running
  *
  * Note there are no card fields anywhere. This is a mock payment flow; card
  * details are never collected, displayed or stored.
 */
export default function CheckoutForm({  defaultEmail = '', defaultName = '' }) {
  const [state, formAction, isPending] = useActionState(
    createOrderAction,
    initialState
  );

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="name" className="eyebrow block">
          Full name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          autoComplete="name"
          defaultValue={state.values?.customerName ?? defaultName}
          aria-invalid={Boolean(state.errors?.name)}
          aria-describedby={state.errors?.name ? 'name-error' : undefined}
          className={`mt-2 w-full rounded-xl border px-4 py-3 text-[15px] focus:outline-none ${
            state.errors?.name
              ? 'border-[var(--z-error)]'
              : 'border-[var(--z-line)] focus:border-[var(--z-ink)]'
          }`}
        />
        {state.errors?.name && (
          <p id="name-error" role="alert" className="mt-2 text-sm text-[var(--z-error)]">
            {state.errors.name}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="eyebrow block">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          aria-invalid={Boolean(state.errors?.email)}
          aria-describedby={state.errors?.email ? 'email-error email-help' : 'email-help'}
          defaultValue={state.values?.email ?? defaultEmail}
          className={`mt-2 w-full rounded-xl border px-4 py-3 text-[15px] focus:outline-none ${
            state.errors?.email
              ? 'border-[var(--z-error)]'
              : 'border-[var(--z-line)] focus:border-[var(--z-ink)]'
          }`}
        />
        {state.errors?.email && (
          <p id="email-error" role="alert" className="mt-2 text-sm text-[var(--z-error)]">
            {state.errors.email}
          </p>
        )}
        <p id="email-help" className="mt-2 text-xs text-[var(--z-ink-soft)]">
          Your eSIM QR code and receipt are sent here.
        </p>
      </div>

      {state.errors?.form && (
        <p
          role="alert"
          className="rounded-xl border border-[var(--z-ink)] px-4 py-3 text-sm"
        >
          {state.errors.form}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="btn btn-primary w-full px-7 py-4 disabled:opacity-70"
      >
        {isPending ? 'Creating your order…' : 'Continue to payment'}
      </button>

      <p className="text-center text-xs text-[var(--z-ink-soft)]">
        No card details are collected on this site.
      </p>
    </form>
  );
}
