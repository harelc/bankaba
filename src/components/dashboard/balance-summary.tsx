'use client';

import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { useLocale } from '@/contexts/locale-context';
import { AnimatedCurrency } from '@/components/ui/animated-number';
import { accrueInterest } from '@/lib/interest';
import { motion } from 'framer-motion';
import type { Deposit } from '@/types';

interface BalanceSummaryProps {
  deposits: Deposit[];
}

export function BalanceSummary({ deposits }: BalanceSummaryProps) {
  const { t, locale } = useLocale();
  const activeDeposits = deposits.filter((d) => d.status === 'active');
  const totalBalance = activeDeposits.reduce(
    (sum, d) => sum + (d.projected_balance_agorot || d.balance_agorot),
    0
  );
  const totalPrincipal = activeDeposits.reduce((sum, d) => sum + d.principal_agorot, 0);
  const totalInterest = totalBalance - totalPrincipal;

  // Calculate just today's interest (1 day of accrual on current balances)
  const todaysInterest = activeDeposits.reduce((sum, d) => {
    const balance = d.projected_balance_agorot || d.balance_agorot;
    const { interestEarned } = accrueInterest(balance, d.interest_rate_bps, 1);
    return sum + interestEarned;
  }, 0);

  return (
    <Card variant="highlight" className="mb-6">
      <div className="text-center">
        <p className="text-purple-200 text-sm mb-1">{t.dashboard.totalBalance}</p>
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="text-4xl sm:text-5xl font-bold mb-2"
        >
          <AnimatedCurrency value={totalBalance} duration={1200} locale={locale} />
        </motion.div>
        {totalInterest > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-purple-200 text-sm flex items-center justify-center gap-1"
          >
            ✨ {t.dashboard.totalInterest}
            <span className="text-yellow-300 font-medium">
              {formatCurrency(totalInterest, locale)}
            </span>
          </motion.p>
        )}
        {todaysInterest > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-purple-200 text-xs mt-1"
          >
            {t.dashboard.grewToday}
            <span className="text-yellow-300 font-medium">
              {formatCurrency(todaysInterest, locale)}
            </span>
          </motion.p>
        )}
      </div>
    </Card>
  );
}
