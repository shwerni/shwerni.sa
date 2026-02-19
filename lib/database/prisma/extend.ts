import { PrismaClient } from "@prisma/client";
import { Prisma } from "@/lib/generated/prisma/client";

const prisma = new PrismaClient().$extends({
  model: {
    $allModels: {
      async paginate<T, A>(
        this: T,
        args: Prisma.Exact<A, Prisma.Args<T, "findMany">> & {
          page?: number;
          limit?: number;
        }
      ) {
        const { page = 1, limit = 9, ...findManyArgs } = args as any;
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
          (this as any).findMany({ ...findManyArgs, take: limit, skip }),
          (this as any).count({ where: (findManyArgs as any).where }),
        ]);

        return {
          data,
          meta: {
            total,
            page,
            totalPages: Math.ceil(total / limit),
          },
        };
      },
    },
  },
});
