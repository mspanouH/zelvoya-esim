'use server';

import { revalidatePath } from 'next/cache';
import { readCart, writeCart, clearCartCookie } from '@/lib/cart';

/**
Server Actions.
 
 The 'use server' directive marks every export in this file as a function that
 runs on the server but can be called directly from a client component. Next
 generates the network call for us — no API route, no fetch, no JSON handling.
 
 The important consequence: cart state is never decided in the browser. A
 client component asks for a plan to be added; the server decides what the
 cart actually contains and writes the cookie. The same principle applies to
 payment later, at much higher stakes.
 */

export async function addToCart(slug) {
  if (typeof slug !== 'string' || !slug) return;

  const cart = await readCart();
  await writeCart([...cart, slug]);

  // Tell Next the cached output of these routes is stale so the cart count and
  // contents are correct on the next render.
  revalidatePath('/cart');
  revalidatePath('/', 'layout');
}

export async function removeFromCart(index) {
  const cart = await readCart();
  const next = cart.filter((_, position) => position !== index);

  await writeCart(next);

  revalidatePath('/cart');
  revalidatePath('/', 'layout');
}

export async function clearCart() {
  await clearCartCookie();

  revalidatePath('/cart');
  revalidatePath('/', 'layout');
}
