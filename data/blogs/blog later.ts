"use server";
// prisma db
import prisma from "@/lib/database/db";

// prisma types
import { BlogState } from "@/lib/generated/prisma/enums";

// get all published questions
export const getAllPublishedBlogs = async () => {
  try {
    const blogs = await prisma.blog.findMany({
      where: { status: BlogState.PUBLISHED },
    });
    return blogs;
  } catch {
    return null;
  }
};

// get question's title by qid
export const getBlogTitleByBid = async (bid: number) => {
  try {
    const blog = await prisma.blog.findFirst({
      where: { bid },
      select: { title: true },
    });
    return blog?.title;
  } catch {
    return null;
  }
};

// get question by qid
export const getBlogByBid = async (bid: number) => {
  try {
    const blog = await prisma.blog.findFirst({
      where: { bid },
    });
    return blog;
  } catch {
    return null;
  }
};

// get Meta Data By pid
export const getBlogMetaDataByByBid = async (bid: number) => {
  try {
    const blog = await prisma.blog.findFirst({
      where: { bid },
      select: {
        title: true,
        image: true,
        consultant: {
          select: {
            cid: true,
            name: true,
          },
        },
      },
    });

    // validate
    if (!blog) return null;

    return {
      cid: blog?.consultant.cid,
      name: blog?.consultant.name,
      title: blog.title,
      image: blog?.image,
    };
  } catch {
    return null;
  }
};

// create new blog // later
// export const createBlog = async () => {};
