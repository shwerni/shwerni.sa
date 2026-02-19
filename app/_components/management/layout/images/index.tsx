"use server";
// React & next
import React from "react";

// components
import EditUploadedImages from "@/app/_components/management/layout/images/editImage";

// prisma data
import { getUploadedImages } from "@/data/uploads";

// types
type ImageAdmin = {
  image: string;
  className?: string;
  children?: React.JSX.Element;
  cid: number;
};

export default async function UploadedImages({
  children,
  image,
  cid,
  className,
}: ImageAdmin) {
  // get list of files
  const images = await getUploadedImages();

  // if not exit
  if (!images) return children;

  // return
  return (
    <EditUploadedImages
      images={images}
      image={image}
      cid={cid}
      className={className}
    >
      {children}
    </EditUploadedImages>
  );
}
