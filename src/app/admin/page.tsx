'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLocale } from '@/contexts/locale-context';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { Users, PiggyBank, Settings, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import type { AccountWithBalance, Deposit } from '@/types';

export default function AdminDashboardPage() {
  const { t, locale } = useLocale();
  const [accounts, setAccounts] = useState<AccountWithBalance[]>([]);
  const [expandedAccount, setExpandedAccount] = useState<string | null>(null);
  const [deposits, setDeposits] = useState<Record<string, Deposit[]>>({});

  const loadAccounts = () => {
    fetch('/api/accounts')
      .then((r) => r.json())
      .then(setAccounts)
      .catch(() => {});
  };

  useEffect(() => { loadAccounts(); }, []);

  const toggleAccount = async (accountId: string) => {
    if (expandedAccount === accountId) {
      setExpandedAccount(null);
      return;
    }
    setExpandedAccount(accountId);
    if (!deposits[accountId]) {
      const r = await fetch(`/api/deposits?accountId=${accountId}`);
      const data = await r.json();
      setDeposits((prev) => ({ ...prev, [accountId]: data }));
    }
  };

  const deleteDeposit = async (depositId: string, depositName: string, accountId: string) => {
    if (!confirm(t.admin.confirmDeleteDeposit(depositName))) return;
    const res = await fetch(`/api/deposits/${depositId}`, { method: 'DELETE' });
    if (res.ok) {
      setDeposits((prev) => ({
        ...prev,
        [accountId]: prev[accountId]?.filter((d) => d.id !== depositId) || [],
      }));
      loadAccounts();
    }
  };

  const childAccounts = accounts.filter((a) => a.role === 'child');
  const totalInBank = childAccounts.reduce((sum, a) => sum + Number(a.total_balance_agorot || 0), 0);
  const totalDeposits = childAccounts.reduce((sum, a) => sum + Number(a.deposit_count || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t.admin.title}</h1>
        <div className="flex gap-2">
          <Link href="/admin/accounts/new">
            <Button size="sm">
              <Plus className="w-4 h-4 me-1" />
              {t.admin.createAccount}
            </Button>
          </Link>
          <Link href="/admin/settings">
            <Button variant="secondary" size="sm">
              <Settings className="w-4 h-4 me-1" />
              {t.admin.settings}
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card variant="highlight">
          <div className="flex items-center gap-3">
            <PiggyBank className="w-8 h-8" />
            <div>
              <p className="text-sm text-purple-200">{t.admin.totalInBank}</p>
              <p className="text-2xl font-bold">{formatCurrency(totalInBank, locale)}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-purple-400" />
            <div>
              <p className="text-sm text-gray-500">{t.admin.allAccounts}</p>
              <p className="text-2xl font-bold text-gray-800">
                {childAccounts.length} {t.admin.accountsCount} · {totalDeposits} {t.admin.depositsCount}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <h2 className="text-lg font-bold text-gray-800 mb-4">{t.admin.allAccounts}</h2>
      <div className="grid gap-4">
        {childAccounts.map((account) => {
          const isExpanded = expandedAccount === account.id;
          const accountDeposits = deposits[account.id] || [];

          return (
            <Card key={account.id}>
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleAccount(account.id)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{account.avatar_emoji}</span>
                  <div>
                    <h3 className="font-bold text-gray-800">{account.name}</h3>
                    <p className="text-sm text-gray-500">
                      {account.deposit_count} {t.admin.depositsCount}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(Number(account.total_balance_agorot || 0), locale)}
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                  {accountDeposits.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-2">{t.admin.noDeposits}</p>
                  )}
                  {accountDeposits.map((dep) => {
                    const balance = dep.projected_balance_agorot || dep.balance_agorot;
                    return (
                      <div key={dep.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-800">{dep.name}</span>
                            <Badge variant={dep.type === 'fixed' ? 'purple' : 'mint'}>
                              {dep.type === 'fixed' ? t.deposits.fixed : t.deposits.flexible}
                            </Badge>
                            <Badge variant={dep.status === 'active' ? 'mint' : dep.status === 'matured' ? 'yellow' : 'gray'}>
                              {t.deposits.status[dep.status]}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                            <span>{formatCurrency(balance, locale)}</span>
                            <span>{formatPercent(dep.interest_rate_bps)}</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteDeposit(dep.id, dep.name, account.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </Button>
                      </div>
                    );
                  })}
                  <Link href={`/admin/accounts?id=${account.id}`} className="block">
                    <Button variant="secondary" size="sm" className="w-full mt-2">
                      {t.admin.editAccount}
                    </Button>
                  </Link>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
