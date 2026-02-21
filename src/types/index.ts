export interface Account {
  id: string;
  name: string;
  role: 'child' | 'admin';
  avatar_emoji: string;
  created_at: string;
  updated_at: string;
}

export interface Deposit {
  id: string;
  account_id: string;
  name: string;
  type: 'flexible' | 'fixed';
  principal_agorot: number;
  balance_agorot: number;
  interest_rate_bps: number;
  term_days: number | null;
  maturity_date: string | null;
  early_withdrawal_penalty_pct: number;
  status: 'active' | 'matured' | 'withdrawn';
  interest_last_accrued_at: string;
  created_at: string;
  updated_at: string;
  // Computed fields (not in DB)
  projected_balance_agorot?: number;
}

export interface Transaction {
  id: string;
  deposit_id: string;
  account_id: string;
  type: 'deposit' | 'withdrawal' | 'interest' | 'penalty' | 'admin_adjustment';
  amount_agorot: number;
  balance_after_agorot: number;
  description: string | null;
  created_at: string;
}

export interface Settings {
  id: number;
  default_flexible_rate_bps: number;
  default_fixed_rate_bps: number;
  default_penalty_pct: number;
  min_deposit_agorot: number;
  currency_symbol: string;
  updated_at: string;
}

export interface SessionPayload {
  accountId: string;
  name: string;
  role: 'child' | 'admin';
  avatarEmoji: string;
}

export interface AccountWithBalance extends Account {
  total_balance_agorot: number;
  deposit_count: number;
}
