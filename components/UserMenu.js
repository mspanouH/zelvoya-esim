'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { logoutAction } from '@/lib/actions/auth';

/**
 * The account button in the navbar, expanded into a menu.
 *
 * Opens on hover for a mouse, and on click/Enter for touch and keyboard —
 * neither input alone is enough to reach everyone. `group-hover` is not used
 * because a hover-only menu is unreachable by keyboard: focus doesn't trigger
 * `:hover`, so the state has to be tracked explicitly here.
 */
export default function UserMenu({ user }) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef(null);
  const rootRef = useRef(null);

  const openMenu = () => {
    clearTimeout(closeTimer.current);
    setOpen(true);
  };

  // A short delay, not an instant close, so moving the mouse from the button
  // to the menu below it doesn't close the menu in the gap between them.
  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  };

  const close = () => {
    clearTimeout(closeTimer.current);
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return undefined;

    function onKeyDown(event) {
      if (event.key === 'Escape') close();
    }
    function onPointerDown(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) close();
    }

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  return (
    <div
      ref={rootRef}
      className="relative"
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="btn btn-secondary px-5 py-2.5"
      >
        {user.name?.split(' ')[0] || 'Account'}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border border-[var(--z-line)] bg-white py-2 shadow-lg"
        >
          <p className="truncate px-4 pb-2 pt-1 text-xs text-[var(--z-ink-soft)]">
            {user.email}
          </p>
          <div className="border-t border-[var(--z-line)]" />

          <Link
            href="/account"
            role="menuitem"
            onClick={close}
            className="block px-4 py-2.5 text-sm text-[var(--z-ink)] hover:bg-[var(--z-mist)]"
          >
            Your account
          </Link>

          {user.role === 'ADMIN' && (
            <Link
              href="/admin/orders"
              role="menuitem"
              onClick={close}
              className="block px-4 py-2.5 text-sm text-[var(--z-ink)] hover:bg-[var(--z-mist)]"
            >
              Admin
            </Link>
          )}

          <div className="my-1 border-t border-[var(--z-line)]" />

          <form action={logoutAction}>
            <button
              type="submit"
              role="menuitem"
              className="block w-full px-4 py-2.5 text-left text-sm text-[var(--z-ink)] hover:bg-[var(--z-mist)]"
            >
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
