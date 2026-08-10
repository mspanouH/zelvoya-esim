'use client';

import { useActionState } from 'react';
import { loginAction } from '@/lib/actions/auth';

const initialState = { error: null, values: {} };

export default function LoginForm({ next = '/account' }) {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState
  );

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="next" value={next} />

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
          defaultValue={state.values?.email || ''}
          className="mt-2 w-full rounded-xl border border-[var(--z-line)] px-4 py-3 text-[15px] focus:border-[var(--z-ink)] focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="password" className="eyebrow block">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mt-2 w-full rounded-xl border border-[var(--z-line)] px-4 py-3 text-[15px] focus:border-[var(--z-ink)] focus:outline-none"
        />
      </div>

      {state?.error && (
        <p
          role="alert"
          className="rounded-xl border border-[var(--z-error)] px-4 py-3 text-sm text-[var(--z-error)]"
        >
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="btn btn-primary w-full px-7 py-4 disabled:opacity-70"
      >
        {isPending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
