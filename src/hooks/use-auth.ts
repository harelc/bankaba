'use client';

import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import type { SessionPayload } from '@/types';

const fetcher = (url: string) => fetch(url).then((r) => {
  if (!r.ok) throw new Error('Not authenticated');
  return r.json();
});

export function useAuth() {
  const router = useRouter();
  const { data: session, error, isLoading, mutate } = useSWR<SessionPayload>(
    '/api/auth/me',
    fetcher,
    { revalidateOnFocus: false }
  );

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    await mutate(undefined);
    router.push('/');
  };

  return {
    session,
    isLoading,
    isAuthenticated: !!session && !error,
    isAdmin: session?.role === 'admin',
    logout,
    mutate,
  };
}
