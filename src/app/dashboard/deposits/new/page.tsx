'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { STRINGS } from '@/lib/constants';
import { ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import type { Settings } from '@/types';
import { formatPercent } from '@/lib/utils';

export default function NewDepositPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'flexible' | 'fixed'>('flexible');
  const [termDays, setTermDays] = useState('365');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.ok ? r.json() : null)
      .then(setSettings)
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const amountAgorot = Math.round(parseFloat(amount) * 100);
    if (isNaN(amountAgorot) || amountAgorot <= 0) {
      setError('סכום לא תקין');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/deposits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          type,
          amount_agorot: amountAgorot,
          term_days: type === 'fixed' ? parseInt(termDays) : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || STRINGS.common.error);
        setLoading(false);
        return;
      }

      router.push('/dashboard');
    } catch {
      setError(STRINGS.common.error);
      setLoading(false);
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

      <h1 className="text-2xl font-bold text-gray-800 mb-6">{STRINGS.deposits.createTitle}</h1>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label={STRINGS.deposits.depositName}
            placeholder={STRINGS.deposits.depositNamePlaceholder}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label={`${STRINGS.deposits.amount} (₪)`}
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {STRINGS.deposits.type}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('flexible')}
                className={`rounded-2xl border-2 p-4 text-center transition-all ${
                  type === 'flexible'
                    ? 'border-mint-400 bg-mint-50 text-mint-500'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                <span className="text-2xl block mb-1">🌊</span>
                <span className="font-medium">{STRINGS.deposits.flexible}</span>
                {settings && (
                  <span className="block text-xs mt-1">
                    {formatPercent(settings.default_flexible_rate_bps)}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setType('fixed')}
                className={`rounded-2xl border-2 p-4 text-center transition-all ${
                  type === 'fixed'
                    ? 'border-purple-400 bg-purple-50 text-purple-600'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                <span className="text-2xl block mb-1">🔐</span>
                <span className="font-medium">{STRINGS.deposits.fixed}</span>
                {settings && (
                  <span className="block text-xs mt-1">
                    {formatPercent(settings.default_fixed_rate_bps)}
                  </span>
                )}
              </button>
            </div>
          </div>

          {type === 'fixed' && (
            <Input
              label={STRINGS.deposits.termDays}
              type="number"
              min="30"
              max="3650"
              value={termDays}
              onChange={(e) => setTermDays(e.target.value)}
              required
            />
          )}

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              STRINGS.deposits.create
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}
