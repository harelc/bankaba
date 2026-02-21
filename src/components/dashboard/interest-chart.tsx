'use client';

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import type { Deposit } from '@/types';

interface InterestChartProps {
  deposit: Deposit;
}

export function InterestChart({ deposit }: InterestChartProps) {
  const data = useMemo(() => {
    const points: { day: number; label: string; balance: number }[] = [];
    const dailyRate = deposit.interest_rate_bps / 10000 / 365;
    let balance = deposit.principal_agorot;
    const totalDays = deposit.type === 'fixed' && deposit.term_days
      ? deposit.term_days
      : 365;

    // Generate ~20 data points across the timeline
    const step = Math.max(1, Math.floor(totalDays / 20));

    points.push({ day: 0, label: 'היום', balance });

    for (let d = step; d <= totalDays; d += step) {
      for (let i = 0; i < step; i++) {
        balance += Math.round(balance * dailyRate);
      }
      const monthsFromNow = d / 30;
      const label = monthsFromNow < 1
        ? `${d} ימים`
        : monthsFromNow < 12
          ? `${Math.round(monthsFromNow)} חודשים`
          : `${(monthsFromNow / 12).toFixed(1)} שנים`;
      points.push({ day: d, label, balance });
    }

    // Ensure final point
    if (points[points.length - 1].day !== totalDays) {
      const remaining = totalDays - points[points.length - 1].day;
      for (let i = 0; i < remaining; i++) {
        balance += Math.round(balance * dailyRate);
      }
      points.push({
        day: totalDays,
        label: deposit.type === 'fixed' ? 'פדיון' : 'שנה',
        balance,
      });
    }

    return points;
  }, [deposit]);

  const totalGrowth = data[data.length - 1].balance - deposit.principal_agorot;

  return (
    <Card className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-800">📈 תחזית צמיחה</h3>
        <span className="text-sm text-mint-500 font-medium">
          +{formatCurrency(totalGrowth)} ריבית צפויה
        </span>
      </div>
      <div className="h-52 -ms-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={(v: number) => `₪${(v / 100).toFixed(0)}`}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
              width={55}
              mirror
            />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => [formatCurrency(Number(value)), 'יתרה']}
              labelFormatter={(label: any) => String(label)}
              contentStyle={{
                borderRadius: '16px',
                border: 'none',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                direction: 'rtl',
                fontSize: '13px',
              }}
            />
            <Area
              type="monotone"
              dataKey="balance"
              stroke="#a855f7"
              strokeWidth={3}
              fill="url(#balanceGradient)"
              animationDuration={1500}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
