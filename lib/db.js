import { PrismaClient } from '@prisma/client';

/**
 * A single shared PrismaClient for the whole application.
 *
 * Why the globalThis dance: in development, Next.js hot-reloads modules on
 * every file save. A plain `new PrismaClient()` at module scope would create a
 * fresh client — and a fresh pool of database connections — on every reload,
 * and after a dozen saves the database refuses new connections.
 *
 * Stashing the client on globalThis survives hot reload, so we reuse one.
 *
 * In production the module is only evaluated once, so we skip the global and
 * just create the client.
 */

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
