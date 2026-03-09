'use client';

import { Card } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useLocale } from '@/contexts/locale-context';
import { ArrowUpCircle, ArrowDownCircle, Sparkles, AlertTriangle, Settings } from 'lucide-react';
import type { Transaction } from '@/types';

const iconMap = {
  deposit: ArrowUpCircle,
  withdrawal: ArrowDownCircle,
  interest: Sparkles,
  penalty: AlertTriangle,
  admin_adjustment: Settings,
};

const colorMap = {
  deposit: 'text-green-500',
  withdrawal: 'text-red-500',
  interest: 'text-mint-500',
  penalty: 'text-yellow-500',
  admin_adjustment: 'text-purple-500',
};

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const { t } = useLocale();

  if (transactions.length === 0) return null;

  return (
    <Card>
      <h3 className="font-bold text-gray-800 mb-4">{t.dashboard.recentTransactions}</h3>
      <div className="space-y-3">
        {transactions.map((tx) => {
          const Icon = iconMap[tx.type] || ArrowUpCircle;
          const color = colorMap[tx.type] || 'text-gray-500';
          return (
            <div key={tx.id} className="flex items-center gap-3">
              <Icon className={`w-5 h-5 ${color} shrink-0`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">
                  {tx.description || t.transactions.types[tx.type]}
                </p>
                <p className="text-xs text-gray-400">{formatDate(tx.created_at)}</p>
              </div>
              <span
                className={`text-sm font-medium ${
                  tx.amount_agorot >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {tx.amount_agorot >= 0 ? '+' : ''}
                {formatCurrency(tx.amount_agorot)}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
