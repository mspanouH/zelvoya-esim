'use client';

import { useState } from 'react';
import Link from 'next/link';

/**
 * Client component because the mobile menu holds open/closed state.
 * Everything else on the homepage stays a server component.
 */
const LINKS = [
  { href: '/#destinations', label: 'Destinations' },
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/#faq', label: 'FAQ' },
  { href: '/contact', label: 'Support' },
];

export default function Navbar({cartCount = 0}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--z-line)] bg-white/85 backdrop-blur">
      <nav
        aria-label="Main"
        className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8"
      >
        <Link
          href="/"
          className="type-display text-xl tracking-[0.22em] text-[var(--z-ink)]"
        >
          ZELVOYA
        </Link>

        {/* Desktop links */}
        <ul className="hidden items-center gap-8 md:flex">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-sm text-[var(--z-ink-soft)] transition-colors hover:text-[var(--z-ink)]"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/account" className="btn btn-secondary px-5 py-2.5">
            Sign in
          </Link>
          <Link
          href="/cart"
          className="btn btn-primary px-5 py-2.5"
          aria-label={`Cart, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}
          >
          Cart
          {cartCount > 0 && (
            <span className="type-mono ml-1 rounded-full bg-white/20 px-2 py-0.5 text-xs">
              {cartCount}
            </span>
          )}
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          className="type-mono rounded-full border border-[var(--z-line)] px-4 py-2 text-xs uppercase tracking-widest md:hidden"
        >
          {open ? 'Close' : 'Menu'}
        </button>
      </nav>

      {open && (
        <div
          id="mobile-menu"
          className="border-t border-[var(--z-line)] bg-white md:hidden"
        >
          <ul className="mx-auto max-w-6xl px-5 py-3 sm:px-8">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block border-b border-[var(--z-line)] py-3.5 text-[15px]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mx-auto flex max-w-6xl gap-3 px-5 pb-5 sm:px-8">
            <Link
              href="/account"
              onClick={() => setOpen(false)}
              className="btn btn-secondary flex-1 px-5 py-3"
            >
              Sign in
            </Link>
            <Link
              href="/cart"
              onClick={() => setOpen(false)}
              className="btn btn-primary flex-1 px-5 py-3"
            >
              Cart
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
