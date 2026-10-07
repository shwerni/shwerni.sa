// package savings against the same sessions at the undiscounted 30-minute price.
// the same math as components/clients/consultants/reservation/packages.tsx, so both pages agree
export function packageSavings(cost30: number, count: number, cost: number) {
  const base = cost30 * count;
  if (base <= 0) return { percent: 0, amount: 0 };
  return {
    percent: Math.round((1 - cost / base) * 100),
    amount: Math.round(base - cost),
  };
}
