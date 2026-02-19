"use client"
// React & Next
import React from "react";
import Image from "next/image";
import { useTheme } from "next-themes";

// types
import { CurrencyValue } from "@/types/admin";

// utils
import { cn } from "@/lib/utils";
import { totalAfterTax, findCurrency } from "@/utils";

// props
interface Props {
  amount: number;
  curreny?: CurrencyValue;
  className?: string;
  textStyle?: string;
  variant?: "xs" | "sm" | "md" | "lg";
  sign?: boolean;
  tax?: number;
}

const CurrencyLabel: React.FC<Props> = ({
  amount,
  curreny = "SAR",
  className,
  textStyle,
  variant = "md",
  sign = true,
  tax
}) => {
  // theme
  const { resolvedTheme } = useTheme();

  // rounded  
  const rounded = totalAfterTax(amount, tax ?? 0);

  // source
  const src = resolvedTheme === "dark" ? "/svg/sar-white.svg" : "/svg/sar.svg";

  // return
  return (
    <span className={cn([className, "inline-flex items-start gap-1.5 mx-1"])}>
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
            variant === "xs" ? "w-2.5 pt-0.5" : variant === "sm" ? "w-3" : variant === "md" ? "w-4" : "w-5"
          }
        />
      ) : (
        <span>{findCurrency(curreny)?.symbole}</span>
      )}
    </span>
  );
};

export default CurrencyLabel;
