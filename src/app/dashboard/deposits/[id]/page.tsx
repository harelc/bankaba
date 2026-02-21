'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDeposit, useTransactions } from '@/hooks/use-deposits';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { WithdrawDialog } from '@/components/deposits/withdraw-dialog';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { formatCurrency, formatPercent, daysBetween } from '@/lib/utils';
import { STRINGS } from '@/lib/constants';
import { ArrowRight, TrendingUp, Calendar, Wallet, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { InterestChart } from '@/components/dashboard/interest-chart';
import { AnimatedCurrency } from '@/components/ui/animated-number';

export default function DepositDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { deposit, isLoading, mutate } = useDeposit(id);
  const { transactions } = useTransactions(id, 50);
  const [showWithdraw, setShowWithdraw] = useState(false);

  if (isLoading || !deposit) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  const displayBalance = deposit.projected_balance_agorot || deposit.balance_agorot;
  const interestEarned = displayBalance - deposit.principal_agorot;
  const daysLeft = deposit.maturity_date
    ? Math.max(0, daysBetween(new Date().toISOString(), deposit.maturity_date))
    : null;

  const handleWithdraw = async () => {
    const res = await fetch(`/api/deposits/${id}/withdraw`, { method: 'POST' });
    if (res.ok) {
      await mutate();
      setShowWithdraw(false);
      router.push('/dashboard');
    }
  };

  return (
    <div>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-purple-500 hover:text-purple-700 mb-4"
      >
        <ArrowRight className="w-4 h-4" />
        {STRINGS.common.back}
      </Link>

      <Card variant="highlight" className="mb-6">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold">{deposit.name}</h1>
            <Badge variant={deposit.type === 'fixed' ? 'purple' : 'mint'} className="mt-1 bg-white/20 text-white">
              {deposit.type === 'fixed' ? STRINGS.deposits.fixed : STRINGS.deposits.flexible}
            </Badge>
          </div>
          <Badge
            variant={deposit.status === 'active' ? 'mint' : deposit.status === 'matured' ? 'yellow' : 'gray'}
          >
            {STRINGS.deposits.status[deposit.status]}
          </Badge>
        </div>

        <AnimatedCurrency value={displayBalance} className="text-4xl font-bold mt-4 block" />

        {deposit.type === 'fixed' && deposit.maturity_date && deposit.status === 'active' && daysLeft !== null && (
          <div className="mt-4">
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white/60 rounded-full"
                style={{
                  width: `${Math.min(100, ((deposit.term_days! - daysLeft) / deposit.term_days!) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Wallet className="w-4 h-4" />
            {STRINGS.deposits.principal}
          </div>
          <div className="text-xl font-bold text-gray-800">{formatCurrency(deposit.principal_agorot)}</div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <TrendingUp className="w-4 h-4" />
            {STRINGS.deposits.interestRate}
          </div>
          <div className="text-xl font-bold text-gray-800">{formatPercent(deposit.interest_rate_bps)}</div>
        </Card>
        {daysLeft !== null && (
          <Card>
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <Calendar className="w-4 h-4" />
              {STRINGS.deposits.daysLeft}
            </div>
            <div className="text-xl font-bold text-gray-800">{daysLeft}</div>
          </Card>
        )}
      </div>

      {deposit.status === 'active' && (
        <InterestChart deposit={deposit} />
      )}

      {interestEarned > 0 && (
        <Card className="mb-6 bg-mint-50 border border-mint-200">
          <div className="text-center">
            <span className="text-2xl">✨</span>
            <p className="text-sm text-mint-500 mt-1">ריבית שנצברה</p>
            <p className="text-2xl font-bold text-mint-500">{formatCurrency(interestEarned)}</p>
          </div>
        </Card>
      )}

      {deposit.status === 'active' && (
        <Button
          variant="danger"
          className="w-full mb-6"
          onClick={() => setShowWithdraw(true)}
        >
          {STRINGS.deposits.withdraw}
        </Button>
      )}

      <RecentTransactions transactions={transactions} />

      {deposit.status === 'active' && (
        <WithdrawDialog
          deposit={deposit}
          open={showWithdraw}
          onClose={() => setShowWithdraw(false)}
          onConfirm={handleWithdraw}
        />
      )}
    </div>
  );
}
