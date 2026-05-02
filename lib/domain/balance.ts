export type BalanceState = "owes" | "settled" | "advance";

export function computeBalancePaise(billedPaise: number, paidPaise: number): number {
  return billedPaise - paidPaise;
}

export function balanceState(balancePaise: number): BalanceState {
  if (balancePaise > 0) return "owes";
  if (balancePaise < 0) return "advance";
  return "settled";
}

export function collectionRate(billedPaise: number, paidPaise: number): number {
  if (billedPaise <= 0) return 1;
  return Math.min(1, paidPaise / billedPaise);
}
