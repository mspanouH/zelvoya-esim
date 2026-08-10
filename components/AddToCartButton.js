'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { addToCart } from '@/lib/actions/cart';

/**
Client component because it needs a click handler and has to show a pending
state while the server action runs.
 
useTransition gives us `isPending` — true from the moment the action is
called until the server has finished and the page has re-rendered. That is
what drives the loading label, and it means the button cannot be double
clicked into adding the same plan twice by accident.
 */
export default function AddToCartButton({ slug, available }) {
  const [isPending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);

  if (!available) {
    return (
      <button
        type="button"
        disabled
        className="btn btn-secondary w-full cursor-not-allowed px-7 py-4 opacity-60"
      >
        Currently unavailable
      </button>
    );
  }

  function handleClick() {
    startTransition(async () => {
      await addToCart(slug);
      setAdded(true);
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="btn btn-primary w-full px-7 py-4 disabled:opacity-70"
      >
        {isPending ? 'Adding…' : 'Add to cart'}
      </button>

      {added && !isPending && (
        <p aria-live="polite" className="mt-3 text-center text-sm text-[var(--z-ink-soft)]">
          Added to your cart.{' '}
          <Link href="/cart" className="text-[var(--z-ink)] underline underline-offset-4">
            View cart
          </Link>
        </p>
      )}
    </div>
  );
}
