import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const log = process.env.NODE_ENV === 'production' ? [] : ['query']

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: log as PrismaClient['options']['log'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
else globalForPrisma.prisma = globalForPrisma.prisma ?? db
