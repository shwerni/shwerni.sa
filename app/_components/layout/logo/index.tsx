"use client"
// React & Next
import React from "react";
import Link from "next/link";
import Image from "next/image";

// packages
import { useTheme } from "next-themes";

// main logo
export default function MLogo() {
  // theme
  const { resolvedTheme } = useTheme();

  // src
  const src = resolvedTheme === 'dark' ? "/layout/logob.png" : "/layout/logo2.png";

  return (
    <Link href="/" className="block relative w-36 sm:w-40">
      <div className="relative w-full h-auto">
        <Image
          className="object-contain"
          src={src}
          alt="logo"
          width={750}
          height={225}
          priority={true}
          sizes="(max-width: 640px) 144px, 256px"
        />
      </div>
    </Link>
  );
}

export function SLogo() {
  return (
    <Link href="/" className="block relative w-48 sm:w-52">
      <div className="relative w-full h-auto">
        <Image
          src="/layout/logob.png"
          alt="logo"
          width={256}
          height={60}
          sizes="(max-width: 640px) 144px, 256px"
        />
      </div>
    </Link>
  );
}
