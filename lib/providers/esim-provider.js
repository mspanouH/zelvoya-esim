import { randomInt, randomUUID } from 'crypto';
import { prisma } from '@/lib/db';

/**
 * Mock eSIM provider.
 *
 * Stands in for an external eSIM supplier. It serves the catalogue and issues
 * eSIMs. Nothing outside this file knows whether that means a database, an HTTP
 * API, or a person with a spreadsheet — which is the point. Swapping in a real
 * supplier changes this file and nothing else.
 */

/** A failure coming from the provider, as opposed to a bug in our code. */
export class EsimProviderError extends Error {}

// --- Catalogue -------------------------------------------------------------

export async function getPlans() {
  return prisma.plan.findMany({
    where: { available: true },
    orderBy: { destination: 'asc' },
  });
}

export async function getPlanBySlug(slug) {
  return prisma.plan.findUnique({ where: { slug } });
}

export async function checkAvailability(slug) {
  const plan = await prisma.plan.findUnique({ where: { slug } });
  return Boolean(plan?.available);
}

// --- Provisioning ----------------------------------------------------------

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Build a plausible ICCID.
 *
 * Real ICCIDs start with 89 (the telecom industry identifier), run 19–20
 * digits, and end with a Luhn check digit — the same checksum used on card
 * numbers. Generating a valid one costs nothing and means the value looks
 * right to anyone who knows the format.
 */
function generateIccid() {
  let digits = '89';
  for (let i = 0; i < 17; i += 1) {
    digits += randomInt(10);
  }
  return digits + luhnCheckDigit(digits);
}

function luhnCheckDigit(digits) {
  let sum = 0;
  let double = true; // the check digit position means we start doubling here

  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let value = Number(digits[i]);
    if (double) {
      value *= 2;
      if (value > 9) value -= 9;
    }
    sum += value;
    double = !double;
  }

  return String((10 - (sum % 10)) % 10);
}

function generateActivationCode() {
  return randomUUID().replace(/-/g, '').toUpperCase().slice(0, 24);
}

/**
 * Ask the provider to issue one eSIM.
 *
 * Returns the activation details. Throws EsimProviderError when the provider
 * refuses — which is a normal, expected outcome, not a crash.
 *
 * simulateFailure exists so the payment-succeeds-then-provisioning-fails path
 * can be demonstrated on demand. A real integration would fail on its own.
 */
export async function provisionEsim({ orderReference, simulateFailure = false }) {
  await wait(600);

  if (simulateFailure) {
    throw new EsimProviderError(
      'The eSIM provider rejected the provisioning request.'
    );
  }

  const smdpAddress = 'smdp.zelvoya-provider.test';
  const activationCode = generateActivationCode();

  return {
    iccid: generateIccid(),
    activationCode,
    smdpAddress,
    // The string a phone actually reads out of the QR image. This is the real
    // GSMA activation format: LPA:1$<SM-DP+ address>$<matching id>
    qrData: `LPA:1$${smdpAddress}$${activationCode}`,
    providerRef: `esim_${randomUUID().slice(0, 12)}`,
    orderReference,
  };
}
