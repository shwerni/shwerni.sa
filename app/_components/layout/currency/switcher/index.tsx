"use client";
// React and Next
import React from "react";

// component
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// types
import { Currency, CurrencyValue } from "@/types/admin";

// utils
import { findCurrency } from "@/utils";

// constant
import { currencies } from "@/constants/admin";

// icons
import { Info } from "lucide-react";

// props
interface Props {
  total: number;
  mockRate: number | null;
  setMockRate: React.Dispatch<React.SetStateAction<number | null>>;
}

export default function CurrencySwitcher({
  total,
  mockRate,
  setMockRate,
}: Props) {
  // on send
  const [onSend, isSending] = React.useTransition();

  // currency
  const [currency, setCurrency] = React.useState<Currency | null>(null);

  // handle currency change
  const handleExchange = (cur: Currency | undefined) => {
    // if cur not exist
    if (!cur) return null;

    // update currency
    console.log(currency);
    setCurrency(cur);
    console.log(currency);

    // mock rate // later api
    const mockRate = 3.75;

    // update mock rate
    setMockRate(mockRate);

    // recalculate total
    const result = total * mockRate;
    // return
    return result.toFixed(2);
  };

  return (
    <div className="w-full max-w-sm mx-auto space-y-4">
      {/* header */}
      <div className="flex items-center gap-3">
        <h3 className="text-sm">العملة</h3>
        <Info className="w-4 text-zblue-200" />
      </div>
      {/* currency switcher */}
      <div className="mx-3 space-y-2">
        <Select
          onValueChange={(value: CurrencyValue) => {
            console.log(value);
            handleExchange(findCurrency(value));
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="اختر العملة" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>العملات</SelectLabel>
              {currencies.map((i, index) => (
                <SelectItem key={index} value={i.value}>
                  {i.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {/* final value */}
        <div className="mx-2">
          <h6>
            الإجمالي{" "}
            <span className="font-bold">
              {mockRate && (total * mockRate).toFixed(2)}{" "}
            </span>
            {currency?.label}
          </h6>
        </div>
      </div>
    </div>
  );
}
