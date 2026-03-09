'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/contexts/locale-context';
import { AVATARS } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';
import { ArrowRight, Loader2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import type { AccountWithBalance } from '@/types';

export default function AdminAccountsPage() {
  const { t } = useLocale();
  const [accounts, setAccounts] = useState<AccountWithBalance[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const loadAccounts = () => {
    fetch('/api/accounts')
      .then((r) => r.json())
      .then(setAccounts)
      .catch(() => {});
  };

  useEffect(() => { loadAccounts(); }, []);

  const startEdit = (account: AccountWithBalance) => {
    setEditing(account.id);
    setEditName(account.name);
    setEditAvatar(account.avatar_emoji);
    setEditPassword('');
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    const body: Record<string, string> = {};
    if (editName) body.name = editName;
    if (editAvatar) body.avatar_emoji = editAvatar;
    if (editPassword) body.password = editPassword;

    await fetch(`/api/accounts/${editing}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    setEditing(null);
    setSaving(false);
    loadAccounts();
  };

  const deleteAccount = async (id: string, name: string) => {
    if (!confirm(t.admin.confirmDeleteAccount(name))) return;
    await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
    loadAccounts();
  };

  const childAccounts = accounts.filter((a) => a.role === 'child');

  return (
    <div>
      <Link href="/admin" className="inline-flex items-center gap-1 text-purple-500 hover:text-purple-700 mb-4">
        <ArrowRight className="w-4 h-4" />
        {t.common.back}
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t.admin.accounts}</h1>
        <Link href="/admin/accounts/new">
          <Button size="sm">{t.admin.createAccount}</Button>
        </Link>
      </div>

      <div className="space-y-4">
        {childAccounts.map((account) => (
          <Card key={account.id}>
            {editing === account.id ? (
              <div className="space-y-4">
                <Input label={t.admin.accountName} value={editName} onChange={(e) => setEditName(e.target.value)} />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t.admin.avatar}</label>
                  <div className="flex flex-wrap gap-2">
                    {AVATARS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setEditAvatar(emoji)}
                        className={`text-2xl p-2 rounded-xl transition-all ${
                          editAvatar === emoji ? 'bg-purple-100 scale-110' : 'hover:bg-gray-100'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
                <Input
                  label={`${t.admin.password} ${t.admin.leaveEmptyToKeep}`}
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button onClick={saveEdit} disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : t.admin.save}
                  </Button>
                  <Button variant="secondary" onClick={() => setEditing(null)}>
                    {t.deposits.cancel}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{account.avatar_emoji}</span>
                  <div>
                    <h3 className="font-bold text-gray-800">{account.name}</h3>
                    <p className="text-sm text-gray-500">
                      {account.deposit_count} {t.admin.depositsCount} · {formatCurrency(Number(account.total_balance_agorot || 0))}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => startEdit(account)}>
                    {t.admin.edit}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteAccount(account.id, account.name)}>
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
