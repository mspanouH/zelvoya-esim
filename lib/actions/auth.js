'use server';

import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { createSession, destroySession } from '@/lib/auth';

export async function loginAction(previousState, formData) {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');
  const next = String(formData.get('next') || '/account');

  if (!email || !password) {
    return { error: 'Enter your email and password.', values: { email } };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  /**
   * One message for both "no such user" and "wrong password".
   *
   * Distinguishing them would let anyone test which email addresses have
   * accounts, one request at a time.
   *
   * The bcrypt comparison runs even when no user was found, against a dummy
   * hash, so a missing account and a wrong password take about the same time.
   * Otherwise the response time alone reveals which case it was.
   */
  const hash = user?.passwordHash || '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv';
  const matches = await bcrypt.compare(password, hash);

  if (!user || !matches) {
    return { error: 'That email and password do not match.', values: { email } };
  }

  await createSession(user);
  revalidatePath('/', 'layout');

  // Only allow redirects inside this site — an attacker could otherwise send
  // someone to ?next=https://example.com and inherit the trust of our domain.
  redirect(next.startsWith('/') ? next : '/account');
}

export async function logoutAction() {
  await destroySession();
  revalidatePath('/', 'layout');
  redirect('/');
}
