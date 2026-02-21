'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { STRINGS, AVATARS } from '@/lib/constants';
import { ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function NewAccountPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState('🐷');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password, avatar_emoji: avatar }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || STRINGS.common.error);
        setLoading(false);
        return;
      }

      router.push('/admin/accounts');
    } catch {
      setError(STRINGS.common.error);
      setLoading(false);
    }
  };

  return (
    <div>
      <Link href="/admin" className="inline-flex items-center gap-1 text-purple-500 hover:text-purple-700 mb-4">
        <ArrowRight className="w-4 h-4" />
        {STRINGS.common.back}
      </Link>

      <h1 className="text-2xl font-bold text-gray-800 mb-6">{STRINGS.admin.createAccount}</h1>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label={STRINGS.admin.accountName}
            placeholder="למשל: נועה"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label={STRINGS.admin.password}
            type="password"
            placeholder="סיסמה פשוטה לילדים"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {STRINGS.admin.avatar}
            </label>
            <div className="flex flex-wrap gap-2">
              {AVATARS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setAvatar(emoji)}
                  className={`text-3xl p-2 rounded-xl transition-all ${
                    avatar === emoji ? 'bg-purple-100 scale-110 ring-2 ring-purple-400' : 'hover:bg-gray-100'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : STRINGS.admin.createAccount}
          </Button>
        </form>
      </Card>
    </div>
  );
}
