'use client';

import useSWR from 'swr';
import type { Deposit, Transaction } from '@/types';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useDeposits(accountId?: string) {
  const url = accountId ? `/api/deposits?accountId=${accountId}` : '/api/deposits';
  const { data, error, isLoading, mutate } = useSWR<Deposit[]>(url, fetcher);
  return { deposits: data || [], error, isLoading, mutate };
}

export function useDeposit(id: string) {
  const { data, error, isLoading, mutate } = useSWR<Deposit>(`/api/deposits/${id}`, fetcher);
  return { deposit: data, error, isLoading, mutate };
}

export function useTransactions(depositId?: string, limit?: number) {
  const params = new URLSearchParams();
  if (depositId) params.set('depositId', depositId);
  if (limit) params.set('limit', limit.toString());
  const url = `/api/transactions?${params}`;
  const { data, error, isLoading } = useSWR<Transaction[]>(url, fetcher);
  return { transactions: data || [], error, isLoading };
}
