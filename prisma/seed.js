const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

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
      tagline: 'From temple sunsets to city nights, stay connected across Japan.',
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
      tagline: 'Open roads, vast landscapes and data that travels with you.',
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
      tagline: 'From coastal towns to late dinners, stay connected through Italy.',
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
      tagline: 'From London landmarks to weekend escapes, stay connected across the UK.',
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
      tagline: 'Sunset crossings, island days and instant travel data.',
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
      tagline: 'Sea, stone and sun — connected from coast to coast.',
      image: '/destinations/cyprus.jpg',
      imageAlt: 'Limestone coastline meeting a deep blue sea at golden hour',
    },
  ];

const USERS = [
  {
    email: 'demo@zelvoya.test',
    name: 'Demo Customer',
    password: 'ZelvoyaDemo2026!',
    role: 'CUSTOMER',
  },
  {
    email: 'admin@zelvoya.test',
    name: 'Demo Admin',
    password: 'ZelvoyaAdmin2026!',
    role: 'ADMIN',
  },
];

async function main() {
  for (const plan of PLANS) {
    await prisma.plan.upsert({
      where: { slug: plan.slug },
      update: plan,
      create: plan,
    });
  }
  console.log(`Seeded ${PLANS.length} plans`);

  for (const user of USERS) {
    const passwordHash = await bcrypt.hash(user.password, 10);
    await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, role: user.role, passwordHash },
      create: {
        email: user.email,
        name: user.name,
        role: user.role,
        passwordHash,
      },
    });
  }
  console.log(`Seeded ${USERS.length} users`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());