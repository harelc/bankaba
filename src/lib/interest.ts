import { daysBetween } from './utils';

/**
 * Calculate compound interest accrued over a number of days.
 * Returns the new balance (in agorot).
 */
export function accrueInterest(
  balanceAgorot: number,
  annualRateBps: number,
  days: number
): { newBalance: number; interestEarned: number } {
  const dailyRate = annualRateBps / 10000 / 365;
  let balance = balanceAgorot;
  for (let i = 0; i < days; i++) {
    const interest = Math.round(balance * dailyRate);
    balance += interest;
  }
  return {
    newBalance: balance,
    interestEarned: balance - balanceAgorot,
  };
}

/**
 * Project the current balance including unaccrued interest since last cron run.
 */
export function projectBalance(
  balanceAgorot: number,
  annualRateBps: number,
  lastAccruedAt: string
): number {
  const now = new Date();
  const days = daysBetween(lastAccruedAt, now);
  if (days <= 0) return balanceAgorot;
  return accrueInterest(balanceAgorot, annualRateBps, days).newBalance;
}

/**
 * Calculate early withdrawal penalty for a fixed deposit.
 */
export function calculatePenalty(
  principalAgorot: number,
  currentBalanceAgorot: number,
  penaltyPct: number
): { penaltyAmount: number; netAmount: number } {
  const totalInterestEarned = currentBalanceAgorot - principalAgorot;
  const penaltyAmount = Math.round(totalInterestEarned * (penaltyPct / 100));
  return {
    penaltyAmount,
    netAmount: currentBalanceAgorot - penaltyAmount,
  };
}
