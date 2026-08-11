import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';

/**
 * Guards every route under /admin.
 *
 * A layout wraps all pages beneath it, so this check runs before any admin page
 * renders — there is no admin route that can skip it.
 *
 * It runs on the server. Hiding the link in the navigation is presentation;
 * this is the actual gate. Note also that each admin server action re-checks
 * the role independently, because an action is a network endpoint that can be
 * called without ever loading a page.
 */
export default async function AdminLayout({ children }) {
  const user = await getSessionUser();

  if (!user) {
    redirect('/login?next=/admin/orders');
  }

  if (user.role !== 'ADMIN') {
    // Deliberately not a 403 page: a customer has no business learning that
    // this route exists.
    redirect('/account');
  }

  return (
    <div>
      <div className="border-b border-[var(--z-line)] bg-[var(--z-mist)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <p className="eyebrow">Zelvoya admin · {user.email}</p>
          <Link
            href="/account"
            className="text-sm underline underline-offset-4"
          >
            Back to account
          </Link>
        </div>
      </div>
      {children}
    </div>
  );
}
