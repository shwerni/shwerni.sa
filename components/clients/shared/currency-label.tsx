"use client";
// React & Next
import React from "react";
import Image from "next/image";

// packages
import { useTheme } from "next-themes";

// types
import { CurrencyValue } from "@/types/admin";

// utils
import { cn } from "@/lib/utils";
import { findCurrency, totalAfterTax } from "@/utils";

// props
interface Props {
  amount: number;
  curreny?: CurrencyValue;
  className?: string;
  textStyle?: string;
  size?: "xs" | "sm" | "md" | "lg";
  sign?: boolean;
  tax?: number;
}

// ⃁ icon
const CurrencyLabel: React.FC<Props> = ({
  amount,
  curreny = "SAR",
  className,
  textStyle,
  size = "md",
  sign = true,
  tax,
}) => {
  // theme
  const { resolvedTheme } = useTheme();

  // rounded
  const rounded = totalAfterTax(amount, tax ?? 0);

  // source
  const src =
    resolvedTheme === "dark"
      ? "/svg/icons/sar-white.svg"
      : "/svg/icons/sar.svg";

  // return
  return (
    <span className={cn([className, "inline-flex items-center gap-1.5"])}>
      <span className={textStyle} dir="ltr">
        {!sign && "- "}
        {rounded}
      </span>
      {curreny === "SAR" ? (
        <Image
          src={src}
          alt="sar"
          width={15}
          height={15}
          className={
            size === "xs"
              ? "w-2.5 pt-0.5"
              : size === "sm"
              ? "w-3"
              : size === "md"
              ? "w-4"
              : "w-5"
          }
        />
      ) : (
        <span>{findCurrency(curreny)?.symbole}</span>
      )}
    </span>
  );
};

export default CurrencyLabel;
