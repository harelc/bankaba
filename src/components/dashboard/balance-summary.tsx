'use client';

import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { STRINGS } from '@/lib/constants';
import { motion } from 'framer-motion';
import type { Deposit } from '@/types';

interface BalanceSummaryProps {
  deposits: Deposit[];
}

export function BalanceSummary({ deposits }: BalanceSummaryProps) {
  const activeDeposits = deposits.filter((d) => d.status === 'active');
  const totalBalance = activeDeposits.reduce(
    (sum, d) => sum + (d.projected_balance_agorot || d.balance_agorot),
    0
  );
  const totalPrincipal = activeDeposits.reduce((sum, d) => sum + d.principal_agorot, 0);
  const totalInterest = totalBalance - totalPrincipal;

  return (
    <Card variant="highlight" className="mb-6">
      <div className="text-center">
        <p className="text-purple-200 text-sm mb-1">{STRINGS.dashboard.totalBalance}</p>
        <motion.div
          key={totalBalance}
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="text-4xl sm:text-5xl font-bold mb-2"
        >
          {formatCurrency(totalBalance)}
        </motion.div>
        {totalInterest > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-purple-200 text-sm flex items-center justify-center gap-1"
          >
            ✨ {STRINGS.dashboard.grewToday}
            <span className="text-yellow-300 font-medium">
              {formatCurrency(totalInterest)}
            </span>
          </motion.p>
        )}
      </div>
    </Card>
  );
}
