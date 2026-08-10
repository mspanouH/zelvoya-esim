import { prisma } from '@/lib/db';

export async function getPlans() {
  return prisma.plan.findMany({
    where: { available: true },
    orderBy: { destination: 'asc' },
  });
}

export async function getPlanBySlug(slug) {
  return prisma.plan.findUnique({ where: { slug } });
}