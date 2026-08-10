import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

if (!process.env.DATABASE_URL) {
    console.error("❌ ERROR: DATABASE_URL is NOT found in process.env!")
} else {
    console.log("✅ DATABASE_URL is present.")
}

let prisma: PrismaClient

if (globalForPrisma.prisma) {
    prisma = globalForPrisma.prisma
} else {
    const connectionString = `${process.env.DATABASE_URL}`
    const pool = new Pool({ connectionString })
    const adapter = new PrismaPg(pool)
    prisma = new PrismaClient({ adapter })
}

// Prisma Client Initialization
export { prisma }

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma