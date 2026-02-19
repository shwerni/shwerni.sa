"use server";
// prisma db
import prisma from "@/lib/database/db";

// get all blogs
export const getAllBlogsDescAdmin = async () => {
  try {
    // get all blogs
    const blogs = await prisma.blog.findMany({
      orderBy: {
        created_at: "desc",
      },
      select: {
        bid: true,
        status: true,
        title: true,
        created_at: true,
        consultant: {
          select: {
            name: true,
          },
        },
      },
    });

    // if not exist
    if (!blogs) return null;

    // return blogs
    return blogs;
  } catch {
    return null;
  }
};

export const getBlogsByBidAdmin = async (bid: number) => {
  try {
    // get all blogs
    const blogs = await prisma.blog.findUnique({ where: { bid } });

    // if not exist
    if (!blogs) return null;

    // return blogs
    return blogs;
  } catch {
    return null;
  }
};
