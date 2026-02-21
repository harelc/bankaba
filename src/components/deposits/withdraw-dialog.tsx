'use client';

import { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { STRINGS } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';
import type { Deposit } from '@/types';
import { calculatePenalty } from '@/lib/interest';

interface WithdrawDialogProps {
  deposit: Deposit;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function WithdrawDialog({ deposit, open, onClose, onConfirm }: WithdrawDialogProps) {
  const [loading, setLoading] = useState(false);

  const displayBalance = deposit.projected_balance_agorot || deposit.balance_agorot;
  const isFixed = deposit.type === 'fixed';
  const isEarly = isFixed && deposit.maturity_date && new Date(deposit.maturity_date) > new Date();

  const penalty = isEarly
    ? calculatePenalty(deposit.principal_agorot, displayBalance, deposit.early_withdrawal_penalty_pct)
    : { penaltyAmount: 0, netAmount: displayBalance };

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          {STRINGS.deposits.withdrawConfirm}
        </h3>

        {isEarly && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-4">
            <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-sm text-yellow-700">
              {STRINGS.deposits.withdrawPenalty}{' '}
              <strong>{deposit.early_withdrawal_penalty_pct}%</strong>{' '}
              {STRINGS.deposits.ofEarnedInterest}
            </p>
            <div className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span>{STRINGS.deposits.penaltyAmount}:</span>
                <span className="text-red-600 font-medium">
                  -{formatCurrency(penalty.penaltyAmount)}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="bg-purple-50 rounded-2xl p-4 mb-6">
          <p className="text-sm text-gray-600">{STRINGS.deposits.youWillReceive}</p>
          <p className="text-3xl font-bold text-purple-600 mt-1">
            {formatCurrency(penalty.netAmount)}
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="danger"
            className="flex-1"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? STRINGS.common.loading : STRINGS.deposits.confirmWithdraw}
          </Button>
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            {STRINGS.deposits.cancel}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
