'use client';

import { useActionState } from 'react';
import { startPaymentAction } from '@/lib/actions/payment';

const initialState = { error: null };

const SCENARIOS = [
  {
    value: 'SUCCESS',
    label: 'Successful payment',
    description: 'The payment is approved and your eSIM is issued.',
  },
  {
    value: 'DECLINE',
    label: 'Declined payment',
    description: 'The card issuer refuses the payment. Nothing is charged.',
  },
  {
    value: 'TIMEOUT',
    label: 'Payment timeout',
    description: 'No response arrives in time. Your order is kept.',
  },
  {
    value: 'SUCCESS_PROVIDER_FAIL',
    label: 'Payment succeeds, eSIM provisioning fails',
    description: 'Payment is confirmed but the eSIM provider rejects the request.',
  },
];

/**
 * The test scenario selector.
 *
 * This exists because there is no real payment gateway. It is labelled as a
 * test control so nobody mistakes it for a live checkout, and there are no card
 * fields anywhere: no number, no expiry, no CVC.
 */
export default function PaymentScenarioForm({ orderId }) {
  const [state, formAction, isPending] = useActionState(
    startPaymentAction,
    initialState
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="orderId" value={orderId} />

      <fieldset disabled={isPending}>
        <legend className="eyebrow">Test payment scenario</legend>

        <div className="mt-4 space-y-3">
          {SCENARIOS.map((scenario, index) => (
            <label
              key={scenario.value}
              htmlFor={`scenario-${scenario.value}`}
              className="flex cursor-pointer gap-3 rounded-xl border border-[var(--z-line)] p-4 transition-colors hover:border-[var(--z-ink)] has-[:checked]:border-[var(--z-ink)]"
            >
              <input
                id={`scenario-${scenario.value}`}
                type="radio"
                name="scenario"
                value={scenario.value}
                defaultChecked={index === 0}
                className="mt-1 accent-[var(--z-pine)]"
              />
              <span>
                <span className="block text-[15px]">{scenario.label}</span>
                <span className="mt-0.5 block text-sm text-[var(--z-ink-soft)]">
                  {scenario.description}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {state?.error && (
        <p
          role="alert"
          className="mt-5 rounded-xl border border-[var(--z-error)] px-4 py-3 text-sm text-[var(--z-error)]"
        >
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="btn btn-primary mt-6 w-full px-7 py-4 disabled:opacity-70"
      >
        {isPending ? 'Contacting payment service…' : 'Pay now'}
      </button>

      {isPending && (
        <p aria-live="polite" className="mt-3 text-center text-sm text-[var(--z-ink-soft)]">
          Waiting for the payment service to confirm. Do not close this page.
        </p>
      )}
    </form>
  );
}
