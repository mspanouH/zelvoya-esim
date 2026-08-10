/**
 TEMPORARY catalogue data.
 */

const PLANS = [
  {
    slug: 'japan',
    destination: 'Japan',
    countryCode: 'JP',
    region: 'Asia Pacific',
    dataGb: 5,
    validityDays: 30,
    network: '4G/5G',
    priceCents: 1299,
    currency: 'EUR',
    available: true,
    popular: true,
    tagline: 'Coverage from Hokkaido to Okinawa, on the day you land.',
    image: '/destinations/japan.jpg',
    imageAlt: 'Layered mountain ridges at dusk under a pale rising moon',
  },
  {
    slug: 'united-states',
    destination: 'United States',
    countryCode: 'US',
    region: 'North America',
    dataGb: 10,
    validityDays: 30,
    network: '4G/5G',
    priceCents: 1899,
    currency: 'EUR',
    available: true,
    popular: true,
    tagline: 'Nationwide data for road trips, cities and everything between.',
    image: '/destinations/united-states.jpg',
    imageAlt: 'Warm desert canyon ridges silhouetted against a low sun',
  },
  {
    slug: 'italy',
    destination: 'Italy',
    countryCode: 'IT',
    region: 'Europe',
    dataGb: 5,
    validityDays: 30,
    network: '4G/5G',
    priceCents: 999,
    currency: 'EUR',
    available: true,
    popular: true,
    tagline: 'Maps, trains and dinner reservations, without the roaming bill.',
    image: '/destinations/italy.jpg',
    imageAlt: 'Golden hills under a soft late afternoon sky',
  },
  {
    slug: 'united-kingdom',
    destination: 'United Kingdom',
    countryCode: 'GB',
    region: 'Europe',
    dataGb: 10,
    validityDays: 30,
    network: '4G/5G',
    priceCents: 1499,
    currency: 'EUR',
    available: true,
    popular: true,
    tagline: 'City break or countryside — connected the moment you land.',
    image: '/destinations/united-kingdom.jpg',
    imageAlt: 'Green moorland hills fading into a grey overcast sky',
  },
  {
    slug: 'thailand',
    destination: 'Thailand',
    countryCode: 'TH',
    region: 'Asia Pacific',
    dataGb: 5,
    validityDays: 15,
    network: '4G/5G',
    priceCents: 1099,
    currency: 'EUR',
    available: true,
    popular: false,
    tagline: 'Short-trip data for islands, cities and everything in between.',
    image: '/destinations/thailand.jpg',
    imageAlt: 'Teal coastal headlands under a bright hazy sky',
  },
  {
    slug: 'cyprus',
    destination: 'Cyprus',
    countryCode: 'CY',
    region: 'Europe',
    dataGb: 10,
    validityDays: 30,
    network: '4G/5G',
    priceCents: 1199,
    currency: 'EUR',
    available: true,
    popular: true,
    tagline: 'Full-island coverage for a month of sea, stone and sun.',
    image: '/destinations/cyprus.jpg',
    imageAlt: 'Limestone coastline meeting a deep blue sea at golden hour',
  },
];

export function getPlans() {
  return PLANS;
}

export function getPlanBySlug(slug) {
  return PLANS.find((plan) => plan.slug === slug) || null;
}

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
