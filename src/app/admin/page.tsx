'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { STRINGS } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';
import { Users, PiggyBank, Settings, Plus } from 'lucide-react';
import Link from 'next/link';
import type { AccountWithBalance } from '@/types';

export default function AdminDashboardPage() {
  const [accounts, setAccounts] = useState<AccountWithBalance[]>([]);

  useEffect(() => {
    fetch('/api/accounts')
      .then((r) => r.json())
      .then(setAccounts)
      .catch(() => {});
  }, []);

  const childAccounts = accounts.filter((a) => a.role === 'child');
  const totalInBank = childAccounts.reduce((sum, a) => sum + Number(a.total_balance_agorot || 0), 0);
  const totalDeposits = childAccounts.reduce((sum, a) => sum + Number(a.deposit_count || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{STRINGS.admin.title}</h1>
        <div className="flex gap-2">
          <Link href="/admin/accounts/new">
            <Button size="sm">
              <Plus className="w-4 h-4 me-1" />
              {STRINGS.admin.createAccount}
            </Button>
          </Link>
          <Link href="/admin/settings">
            <Button variant="secondary" size="sm">
              <Settings className="w-4 h-4 me-1" />
              {STRINGS.admin.settings}
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card variant="highlight">
          <div className="flex items-center gap-3">
            <PiggyBank className="w-8 h-8" />
            <div>
              <p className="text-sm text-purple-200">{STRINGS.admin.totalInBank}</p>
              <p className="text-2xl font-bold">{formatCurrency(totalInBank)}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-purple-400" />
            <div>
              <p className="text-sm text-gray-500">{STRINGS.admin.allAccounts}</p>
              <p className="text-2xl font-bold text-gray-800">
                {childAccounts.length} חשבונות · {totalDeposits} חיסכונות
              </p>
            </div>
          </div>
        </Card>
      </div>

      <h2 className="text-lg font-bold text-gray-800 mb-4">{STRINGS.admin.allAccounts}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {childAccounts.map((account) => (
          <Link key={account.id} href={`/admin/accounts?id=${account.id}`}>
            <Card className="hover:scale-[1.02] transition-transform cursor-pointer">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{account.avatar_emoji}</span>
                <div>
                  <h3 className="font-bold text-gray-800">{account.name}</h3>
                  <p className="text-sm text-gray-500">
                    {account.deposit_count} חיסכונות
                  </p>
                </div>
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(Number(account.total_balance_agorot || 0))}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
