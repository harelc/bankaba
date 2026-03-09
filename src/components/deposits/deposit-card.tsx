'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatPercent, formatDate, daysBetween } from '@/lib/utils';
import { useLocale } from '@/contexts/locale-context';
import { AnimatedCurrency } from '@/components/ui/animated-number';
import { TrendingUp, Calendar, Sparkles } from 'lucide-react';
import Link from 'next/link';
import type { Deposit } from '@/types';
import { motion } from 'framer-motion';

interface DepositCardProps {
  deposit: Deposit;
  index?: number;
}

export function DepositCard({ deposit, index = 0 }: DepositCardProps) {
  const { t } = useLocale();
  const displayBalance = deposit.projected_balance_agorot || deposit.balance_agorot;
  const interestEarned = displayBalance - deposit.principal_agorot;
  const daysLeft = deposit.maturity_date
    ? Math.max(0, daysBetween(new Date().toISOString(), deposit.maturity_date))
    : null;

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
    >
      <Link href={`/dashboard/deposits/${deposit.id}`}>
        <Card className="cursor-pointer hover:shadow-xl hover:shadow-purple-100 transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-bold text-lg text-gray-800">{deposit.name}</h3>
              <Badge variant={deposit.type === 'fixed' ? 'purple' : 'mint'}>
                {deposit.type === 'fixed' ? t.deposits.fixed : t.deposits.flexible}
              </Badge>
            </div>
            {deposit.status === 'active' && interestEarned > 0 && (
              <div className="flex items-center gap-1 text-mint-500 text-sm">
                <Sparkles className="w-4 h-4" />
                <span>+{formatCurrency(interestEarned)}</span>
              </div>
            )}
          </div>

          <div className="text-3xl font-bold text-purple-600 mb-4">
            <AnimatedCurrency value={displayBalance} duration={800} />
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              <span>{formatPercent(deposit.interest_rate_bps)}</span>
            </div>
            {daysLeft !== null && (
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{daysLeft} {t.deposits.daysLeft}</span>
              </div>
            )}
            {deposit.status !== 'active' && (
              <Badge variant={deposit.status === 'matured' ? 'yellow' : 'gray'}>
                {t.deposits.status[deposit.status]}
              </Badge>
            )}
          </div>

          {deposit.type === 'fixed' && deposit.maturity_date && deposit.status === 'active' && (
            <div className="mt-3">
              <div className="h-2 bg-purple-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-l from-purple-500 to-mint-400 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.max(5, ((deposit.term_days! - daysLeft!) / deposit.term_days!) * 100))}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>{formatDate(deposit.created_at)}</span>
                <span>{formatDate(deposit.maturity_date)}</span>
              </div>
            </div>
          )}
        </Card>
      </Link>
    </motion.div>
  );
}
