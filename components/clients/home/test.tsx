"use client";

import { orderStatusPaid } from "@/data/order/reserveation";

export function TestGoogle() {
  async function test() {
    
    console.log("res start");
    const res = await orderStatusPaid("1eaad995-4980-4854-a0db-810f44a57758");
    
    console.log("res test");
    console.log(res);
  }
  return <button onClick={async () => await test()} className="bg-green-500 p-5">sdsdds</button>;
}
