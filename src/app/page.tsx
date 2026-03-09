'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/contexts/locale-context';
import { Lock } from 'lucide-react';

interface AccountPreview {
  id: string;
  name: string;
  avatar_emoji: string;
  role: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLocale();
  const [accounts, setAccounts] = useState<AccountPreview[]>([]);
  const [selected, setSelected] = useState<AccountPreview | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  useEffect(() => {
    fetch('/api/accounts')
      .then((r) => r.json())
      .then((data) => Array.isArray(data) ? setAccounts(data) : setAccounts([]))
      .catch(() => {})
      .finally(() => setLoadingAccounts(false));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: selected.id, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || t.login.wrongPassword);
        setLoading(false);
        return;
      }

      const data = await res.json();
      router.push(data.account.role === 'admin' ? '/admin' : '/dashboard');
    } catch {
      setError(t.common.error);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <span className="text-6xl mb-4 block">🏦</span>
          <h1 className="text-4xl font-bold text-purple-600">
            {t.login.title}
          </h1>
          <p className="text-gray-500 mt-2">{t.login.subtitle}</p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          <AnimatePresence>
            {accounts.map((account, i) => (
              <motion.div
                key={account.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card
                  className={`cursor-pointer text-center hover:scale-105 transition-transform ${
                    selected?.id === account.id
                      ? 'ring-4 ring-purple-400 bg-purple-50'
                      : ''
                  }`}
                  onClick={() => {
                    setSelected(account);
                    setPassword('');
                    setError('');
                  }}
                >
                  <span className="text-4xl block mb-2">
                    {account.avatar_emoji}
                  </span>
                  <span className="font-medium text-gray-700">
                    {account.name}
                  </span>
                  {account.role === 'admin' && (
                    <span className="block text-xs text-purple-400 mt-1">
                      {t.common.admin}
                    </span>
                  )}
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {selected && (
            <motion.form
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              onSubmit={handleLogin}
              className="overflow-hidden"
            >
              <Card className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">{selected.avatar_emoji}</span>
                  <span className="text-lg font-medium">{selected.name}</span>
                </div>
                <div className="relative">
                  <Lock className="absolute start-4 top-1/2 -translate-y-1/2 text-purple-300 w-5 h-5" />
                  <Input
                    type="password"
                    placeholder={t.login.passwordPlaceholder}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="ps-12"
                    autoFocus
                    error={error}
                  />
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? t.common.loading : t.login.loginButton}
                </Button>
              </Card>
            </motion.form>
          )}
        </AnimatePresence>

        {loadingAccounts && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-5xl"
            >
              🐷
            </motion.div>
            <p className="text-gray-400 text-sm">{t.common.loading}</p>
          </div>
        )}
      </div>
    </div>
  );
}
