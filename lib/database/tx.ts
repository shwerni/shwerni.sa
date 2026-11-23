// prisma db
import type prisma from "@/lib/database/db";

// the client inside prisma.$transaction(async (tx) => …) for our (extended) client. Prisma's own
// Prisma.TransactionClient is the plain client's and doesn't match it
export type DbTx = Parameters<Extract<Parameters<typeof prisma.$transaction>[0], (...args: never[]) => unknown>>[0];
