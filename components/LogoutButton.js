'use client';

import { useTransition } from 'react';
import { logoutAction } from '@/lib/actions/auth';

export default function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => logoutAction())}
      className="btn btn-secondary px-5 py-2.5 disabled:opacity-60"
    >
      {isPending ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
