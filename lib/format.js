/**
 * Money is stored and passed around in cents (integers) and only formatted at
 * the edge, where it is displayed. Floating point euros drift; integers do not.
 */
export function formatPrice(priceCents, currency = 'EUR') {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency,
  }).format(priceCents / 100);
}
