'use client';

import { useDeposits, useTransactions } from '@/hooks/use-deposits';
import { BalanceSummary } from '@/components/dashboard/balance-summary';
import { DepositCard } from '@/components/deposits/deposit-card';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/contexts/locale-context';
import { Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { t } = useLocale();
  const { deposits, isLoading } = useDeposits();
  const { transactions } = useTransactions(undefined, 10);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t.dashboard.title}</h1>
        <Link href="/dashboard/deposits/new">
          <Button size="sm">
            <Plus className="w-4 h-4 me-1" />
            {t.dashboard.newDeposit}
          </Button>
        </Link>
      </div>

      <BalanceSummary deposits={deposits} />

      {deposits.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <span className="text-5xl block mb-4">🐷</span>
          <p>{t.dashboard.noDeposits}</p>
          <Link href="/dashboard/deposits/new">
            <Button className="mt-4">{t.dashboard.newDeposit}</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 mb-6">
          {deposits.map((deposit, i) => (
            <DepositCard key={deposit.id} deposit={deposit} index={i} />
          ))}
        </div>
      )}

      <RecentTransactions transactions={transactions} />
    </div>
  );
}
