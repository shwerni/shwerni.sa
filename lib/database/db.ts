// import { PrismaClient } from "@/lib/generated/prisma/client";
// import { withAccelerate } from "@prisma/extension-accelerate";

// const prisma = new PrismaClient({
//   accelerateUrl: process.env.DATABASE_URL as string,
// }).$extends(withAccelerate())

// export default prisma;

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

// unfiltered client: transactional code that must see center consultants too
// (booking, pricing, after-payment flows). see docs/centers/CENTERS_SPEC.md §6
export const prismaAll = new PrismaClient({ adapter });

// consultant reads the safe client filters
const CONSULTANT_READS = new Set([
  "findMany",
  "findFirst",
  "findFirstOrThrow",
  "findUnique",
  "findUniqueOrThrow",
  "count",
  "aggregate",
  "groupBy",
]);

// safe client (the default export): every consultant read gets centerId: null
// unless the query sets centerId itself, so center consultants never leak into
// platform lists. only queries that start at consultant are covered; nested
// includes, relation filters and raw sql are filtered by hand
const prisma = prismaAll.$extends({
  name: "centers-safe",
  query: {
    consultant: {
      async $allOperations({ operation, args, query }) {
        if (CONSULTANT_READS.has(operation)) {
          const a = args as { where?: Prisma.ConsultantWhereInput };
          // `undefined` counts as "not set": prisma silently drops undefined filters, which would leak every center
          if (a.where?.centerId === undefined)
            a.where = { ...a.where, centerId: null };
        }
        return query(args);
      },
    },
  },
});

export default prisma;
