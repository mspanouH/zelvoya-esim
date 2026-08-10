'use server';

import { redirect } from 'next/navigation';
import { readCart} from '@/lib/cart';
import { createOrder, OrderError } from '@/lib/order-service';
import { getSessionUser } from '@/lib/auth';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Called by the checkout form.
 *
 * Signature is (previousState, formData) because it is used with
 * useActionState, which passes the last returned value back in on each call.
 *
 * Returns { errors, values } to re-render the form with messages and the
 * customer's typed values intact. Success redirects to the payment page.
 */
export async function createOrderAction(previousState, formData) {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const customerName = String(formData.get('name') || '').trim();
  const values = { email, customerName };

  const errors = {};

  if (email.length === 0) {
    errors.email = 'Enter your email address.';
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'That does not look like an email address. Check for a typo.';
  }

  if (customerName.length === 0) {
    errors.name = 'Enter your full name.';
  } else if (customerName.length < 2) {
    errors.name = 'Your name needs at least 2 characters.';
  }

  if (Object.keys(errors).length > 0) {
    return { errors, values };
  }

  // Read the cart on the server. The form submits only contact details —
  // never prices or plan ids.
  const slugs = await readCart();
  const user = await getSessionUser();
  let order;
  try {
    order = await createOrder({
      email,
      customerName,
      slugs,
      userId: user?.id ?? null,
    });
  
  } catch (error) {
    if (error instanceof OrderError) {
      return { errors: { form: error.message }, values };
    }
    console.error('Order creation failed', error);
    return {
      errors: { form: 'We could not create your order. Please try again.' },
      values,
    };
  }



  // redirect() throws a special value that Next catches, so it must be called
  // outside the try/catch above — a catch block would swallow it.
  redirect(`/payment/${order.id}`);
}
