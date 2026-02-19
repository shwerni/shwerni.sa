"use client";
import Image from "next/image";
import React from "react";

export default function ZImage(props: {
  src: string;
  width?: number;
  height?: number;
  alt?: string;
  className?: string;
  fill?: boolean;
  priority?: boolean;
}) {
  // props
  const { src, width, height, alt, className, fill, priority } = props;
  console.log(priority);
  // return
  return (
    <Image
      src={src}
      width={width}
      height={height}
      alt={alt ?? "img"}
      fill={fill}
      priority={priority}
      className={`${className} transition-opacity opacity-0 ease-in-out duration-300`}
      onLoadingComplete={(image) => image.classList.remove("opacity-0")}
    />
  );
}
