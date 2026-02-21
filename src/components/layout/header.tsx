'use client';

import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { STRINGS } from '@/lib/constants';
import { LogOut, Settings, Home } from 'lucide-react';
import Link from 'next/link';

export function Header() {
  const { session, isAdmin, logout } = useAuth();

  if (!session) return null;

  return (
    <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-lg border-b border-purple-100">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={isAdmin ? '/admin' : '/dashboard'} className="flex items-center gap-2">
            <span className="text-2xl">🏦</span>
            <span className="font-bold text-purple-600 text-lg hidden sm:block">
              {STRINGS.appName}
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <Home className="w-4 h-4 me-1" />
                  <span className="hidden sm:inline">לוח בקרה</span>
                </Button>
              </Link>
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  <Settings className="w-4 h-4 me-1" />
                  <span className="hidden sm:inline">{STRINGS.admin.title}</span>
                </Button>
              </Link>
            </>
          )}
          <div className="flex items-center gap-2 ms-2">
            <span className="text-xl">{session.avatarEmoji}</span>
            <span className="text-sm font-medium text-gray-600 hidden sm:block">
              {session.name}
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
