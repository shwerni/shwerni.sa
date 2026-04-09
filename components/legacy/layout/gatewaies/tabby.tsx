/* eslint-disable @typescript-eslint/no-explicit-any */
// React & Next
import React from "react";
import Script from "next/script";

// components
import { Button } from "@/components/ui/button";

// types
import { CurrencyValue } from "@/types/admin";

// icons
import { Info } from "lucide-react";

// card
export const TabbyCardScript = ({
  price,
  currency,
  show,
}: {
  price: number;
  currency: CurrencyValue;
  show: boolean;
}) => {
  return (
    <>
      <div id="tabbyCard" className={show ? "" : "hidden"} />
      <Script
        src="https://checkout.tabby.ai/tabby-card.js"
        strategy="lazyOnload"
        onLoad={() => {
          const TabbyCard = (window as any).TabbyCard;
          if (typeof TabbyCard !== "undefined") {
            new TabbyCard({
              selector: "#tabbyCard",
              currency,
              lang: "ar",
              price,
              size: "narrow",
              theme: "black",
              header: false,
            });
          }
        }}
      />
    </>
  );
};

// promo
export const TabbyPromoScript = ({
  price,
  currency,
}: {
  price: number;
  currency: CurrencyValue;
}) => {
  return (
    <>
      <Script
        src="https://checkout.tabby.ai/tabby-promo.js"
        strategy="lazyOnload"
        onLoad={() => {
          const TabbyPromo = (window as any).TabbyPromo;
          if (typeof TabbyPromo !== "undefined") {
            new TabbyPromo({
              currency,
              lang: "ar",
              price,
              size: "narrow",
            });
          }
        }}
      />
      <Button
        type="button"
        variant="ghost"
        data-tabby-info="installments"
        data-tabby-price={price.toString()}
        data-tabby-currency={currency}
        className="flex items-center justify-center p-2 cursor-pointer"
      >
        <Info className="w-7 text-zblue-200 pointer-events-none" />
      </Button>
    </>
  );
};

// promo on site
export const OnSiteTabbyPromoScript = ({
  price,
  currency,
}: {
  price: number;
  currency: CurrencyValue;
}) => {
  return (
    <React.Fragment key={price}>
      <div
        id="TabbyPromo"
        className="bg-white dark:bg-transparent rounded-xl"
      ></div>
      <Script
        src="https://checkout.tabby.ai/tabby-promo.js"
        strategy="afterInteractive"
        onReady={() => {
          const TabbyPromo = (window as any).TabbyPromo;
          if (typeof TabbyPromo !== "undefined") {
            new TabbyPromo({
              selector: "#TabbyPromo",
              currency,
              lang: "ar",
              price,
              size: "narrow",
            });
          }
        }}
        data-tabby-info="installments"
        data-tabby-price={price.toString()}
        data-tabby-currency={currency}
      />
    </React.Fragment>
  );
};
