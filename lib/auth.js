import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'crypto';
import { prisma } from '@/lib/db';

/**
 * Session handling.
 *
 * The cookie holds a small JSON payload and a signature:
 *
 *   base64url({"userId":"...","exp":1234567890}).<hmac>
 *
 * The signature is HMAC-SHA256 over the payload using AUTH_SECRET. A customer
 * can read and edit their own cookies, so the payload is not trusted on its
 * own — change one character and the signature no longer matches and the
 * session is rejected. Without this, anyone could edit their cookie to claim
 * they are an admin.
 *
 * Kept deliberately small: no session table, no library. The brief asked for
 * simple authentication, and a signed cookie is the smallest thing that is
 * actually safe.
 */

const COOKIE_NAME = 'zelvoya_session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error('AUTH_SECRET is not set');
  return value;
}

function sign(payload) {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

function serialise(data) {
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

function deserialise(token) {
  if (typeof token !== 'string') return null;

  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;

  const expected = Buffer.from(sign(payload), 'utf8');
  const received = Buffer.from(signature, 'utf8');

  if (expected.length !== received.length) return null;
  if (!timingSafeEqual(expected, received)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (!data.exp || data.exp < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch {
    return null;
  }
}

export async function createSession(user) {
  const store = await cookies();

  store.set(
    COOKIE_NAME,
    serialise({
      userId: user.id,
      exp: Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS,
    }),
    {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: MAX_AGE_SECONDS,
      secure: process.env.NODE_ENV === 'production',
    }
  );
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/**
 * The signed-in user, or null.
 *
 * The role is read from the database rather than the cookie. A cookie issued
 * before a role changed would otherwise keep the old permissions until it
 * expired.
 */
export async function getSessionUser() {
  const store = await cookies();
  const session = deserialise(store.get(COOKIE_NAME)?.value);

  if (!session) return null;

  return prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, role: true },
  });
}

export async function isAdmin() {
  const user = await getSessionUser();
  return user?.role === 'ADMIN';
}

/**
 * Order access.
 *
 * An order id is a cuid: sortable and not designed to double as a bearer
 * secret. /order/[id] and /payment/[id] are reachable by guests who never get
 * a session, so id alone cannot be the access check.
 *
 * signOrderAccess derives a token from the id with the same secret used for
 * session cookies. It is deterministic and does not expire — the receipt page
 * is meant to be bookmarked indefinitely — so any code holding an order id it
 * is entitled to (checkout, the payment redirect, the order page itself) can
 * regenerate the token rather than having to thread it through every link.
 */
export function signOrderAccess(orderId) {
  return sign(`order:${orderId}`);
}

function verifyOrderAccess(orderId, token) {
  if (typeof token !== 'string' || token.length === 0) return false;

  const expected = Buffer.from(signOrderAccess(orderId), 'utf8');
  const received = Buffer.from(token, 'utf8');

  if (expected.length !== received.length) return false;
  return timingSafeEqual(expected, received);
}

/**
 * Whether the current viewer may see this order.
 *
 * A signed-in viewer is checked against the order's owner (by userId, or by
 * email so a guest order still belongs to whoever later signs in with that
 * address) or the admin role. A guest carries no session, so their claim is
 * the signed token instead.
 */
export function canAccessOrder(order, user, token) {
  if (user) {
    return (
      user.role === 'ADMIN' || order.userId === user.id || order.email === user.email
    );
  }
  return verifyOrderAccess(order.id, token);
}
