import { cookies } from 'next/headers';

/**
 The cart lives in a cookie: a JSON array of plan slugs.
 
 ['japan', 'italy', 'japan']
 
 Duplicates are allowed and meaningful — each entry becomes one order line and
 one eSIM, which matches how the database models delivery (no quantity column,
 one eSIM per line).
 
 Why a cookie rather than a database cart: it survives a page reload and a
 closed tab, needs no user account, and the server can read it directly, so
 the cart page stays a server component. A database cart would mean identifying
anonymous visitors, which is more machinery than a 48-hour build needs.
 */

const CART_COOKIE = 'zelvoya_cart';
const ONE_WEEK = 60 * 60 * 24 * 7;

export async function readCart() {
  const store = await cookies();
  const raw = store.get(CART_COOKIE)?.value;

  if (!raw) return [];

  // A user can edit their own cookies, so never trust the contents.
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === 'string') : [];
  } catch {
    return [];
  }
}

export async function writeCart(slugs) {
  const store = await cookies();

  store.set(CART_COOKIE, JSON.stringify(slugs), {
    httpOnly: true, // JavaScript in the browser cannot read or alter it
    sameSite: 'lax',
    path: '/',
    maxAge: ONE_WEEK,
    secure: process.env.NODE_ENV === 'production',
  });
}

export async function clearCartCookie() {
  const store = await cookies();
  store.delete(CART_COOKIE);
}
