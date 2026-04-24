"use client";

import { aiAcceptReview } from "@/lib/api/ai/ai";

export function TestGoogle() {
  async function test() {
    const rev = await aiAcceptReview(
      "الله يعطيها العافيه واشكرها جزيل الشكر استفدت كثير",
      true,
    );
    console.log(rev);
    console.log(rev);
  }
  return <button onClick={async() => await test()}>sdsdds</button>;
}
