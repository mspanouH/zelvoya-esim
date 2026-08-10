'use client';

import { useTransition } from 'react';
import { removeFromCart } from '@/lib/actions/cart';

export default function RemoveFromCartButton({ index, destination }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => removeFromCart(index))}
      className="text-sm text-[var(--z-ink-soft)] underline underline-offset-4 hover:text-[var(--z-ink)] disabled:opacity-50"
    >
      {isPending ? 'Removing…' : `Remove ${destination}`}
    </button>
  );
}