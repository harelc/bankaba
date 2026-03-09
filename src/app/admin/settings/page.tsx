'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/contexts/locale-context';
import { ArrowRight, Loader2, Save } from 'lucide-react';
import Link from 'next/link';
import type { Settings } from '@/types';

export default function AdminSettingsPage() {
  const { t } = useLocale();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((data) => { setSettings(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setMessage('');

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          default_flexible_rate_bps: settings.default_flexible_rate_bps,
          default_fixed_rate_bps: settings.default_fixed_rate_bps,
          default_penalty_pct: settings.default_penalty_pct,
          min_deposit_agorot: settings.min_deposit_agorot,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        setMessage(t.admin.settingsSaved);
      }
    } catch {
      setMessage(t.common.error);
    }
    setSaving(false);
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <Link href="/admin" className="inline-flex items-center gap-1 text-purple-500 hover:text-purple-700 mb-4">
        <ArrowRight className="w-4 h-4" />
        {t.common.back}
      </Link>

      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t.admin.settings}</h1>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label={`${t.admin.defaultFlexibleRate} ${t.admin.basisPointsHint}`}
            type="number"
            min="0"
            max="10000"
            value={settings.default_flexible_rate_bps}
            onChange={(e) => setSettings({ ...settings, default_flexible_rate_bps: parseInt(e.target.value) || 0 })}
          />
          <p className="text-xs text-gray-400 -mt-3">{(settings.default_flexible_rate_bps / 100).toFixed(2)}%</p>

          <Input
            label={`${t.admin.defaultFixedRate} ${t.admin.basisPointsHint}`}
            type="number"
            min="0"
            max="10000"
            value={settings.default_fixed_rate_bps}
            onChange={(e) => setSettings({ ...settings, default_fixed_rate_bps: parseInt(e.target.value) || 0 })}
          />
          <p className="text-xs text-gray-400 -mt-3">{(settings.default_fixed_rate_bps / 100).toFixed(2)}%</p>

          <Input
            label={`${t.admin.defaultPenalty} (%)`}
            type="number"
            min="0"
            max="100"
            value={settings.default_penalty_pct}
            onChange={(e) => setSettings({ ...settings, default_penalty_pct: parseInt(e.target.value) || 0 })}
          />

          <Input
            label={`${t.admin.minDeposit} ${t.admin.agorotHint}`}
            type="number"
            min="1"
            value={settings.min_deposit_agorot}
            onChange={(e) => setSettings({ ...settings, min_deposit_agorot: parseInt(e.target.value) || 0 })}
          />
          <p className="text-xs text-gray-400 -mt-3">= {(settings.min_deposit_agorot / 100).toFixed(2)} ₪</p>

          {message && (
            <p className={`text-sm text-center ${message === t.common.error ? 'text-red-500' : 'text-green-600'}`}>
              {message}
            </p>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={saving}>
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                <Save className="w-5 h-5 me-2" />
                {t.admin.save}
              </>
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}
