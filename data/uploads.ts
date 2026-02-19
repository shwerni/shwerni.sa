"use server";
// prisma db
import prisma from "@/lib/database/db";

// save uplaoded images
export const saveUploadedImage = async (
  title: string,
  key: string,
  url: string
) => {
  // if no data
  if (!title || !url) return null;

  // save image
  try {
    const images = await prisma.image.create({
      data: {
        key,
        title,
        url,
      },
      select: {
        url: true,
      },
    });
    return images;
  } catch {
    return null;
  }
};

// get images
export const getUploadedImages = async () => {
  // save image
  try {
    const images = await prisma.image.findMany({
      select: {
        key: true,
        url: true,
      },
    });
    return images;
  } catch {
    return null;
  }
};

// save uplaoded files
export const saveUploadedFile = async (
  title: string,
  key: string,
  url: string
) => {
  // if no data
  if (!title || !url) return null;

  // save file
  try {
    const coupon = await prisma.file.create({
      data: {
        key,
        title,
        url,
      },
      select: {
        url: true,
      },
    });
    return coupon;
  } catch {
    return null;
  }
};
