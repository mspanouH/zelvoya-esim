import LoginForm from '@/components/LoginForm';
import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Sign in — Zelvoya' };

export default async function LoginPage({ searchParams }) {
  const user = await getSessionUser();
  if (user) redirect('/account');

  // searchParams is a Promise in Next 16, same as params.
  const { next } = await searchParams;

  return (
    <div className="mx-auto max-w-md px-5 py-16 sm:px-8 sm:py-24">
      <h1 className="type-display text-4xl">Sign in</h1>
      <p className="mt-3 text-[15px] text-[var(--z-ink-soft)]">
        Your eSIMs, QR codes and order history live here.
      </p>

      <div className="mt-8">
        <LoginForm next={typeof next === 'string' ? next : '/account'} />
      </div>

      <div className="mt-10 rounded-2xl border border-dashed border-[var(--z-line)] p-5">
        <p className="eyebrow">Demo accounts</p>
        <dl className="mt-3 space-y-3 text-sm">
          <div>
            <dt className="text-[var(--z-ink-soft)]">Customer</dt>
            <dd className="type-mono mt-0.5 break-all text-xs">
              demo@zelvoya.test / ZelvoyaDemo2026!
            </dd>
          </div>
          <div>
            <dt className="text-[var(--z-ink-soft)]">Admin</dt>
            <dd className="type-mono mt-0.5 break-all text-xs">
              admin@zelvoya.test / ZelvoyaAdmin2026!
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-xs leading-relaxed text-[var(--z-ink-soft)]">
          This is a demonstration site. These accounts hold no real data.
        </p>
      </div>

      <p className="mt-8 text-sm text-[var(--z-ink-soft)]">
        You do not need an account to buy — checkout works as a guest, and
        orders appear here when you sign in with the same email address.
      </p>
    </div>
  );
}
