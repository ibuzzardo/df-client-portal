'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  };
}

const navItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Projects', href: '/dashboard/projects' },
];

export function Sidebar({ user }: SidebarProps): React.JSX.Element {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col justify-between gap-6">
      <div className="space-y-6">
        <div>
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">Client Portal</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Manage projects and delivery updates.</p>
        </div>

        <nav className="space-y-2" aria-label="Sidebar Navigation">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'inline-flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 active:bg-slate-200',
                  isActive ? 'bg-slate-100 text-slate-900' : '',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="space-y-4 border-t border-slate-200 pt-4 dark:border-slate-800">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{user.name ?? 'User'}</p>
          <p className="break-all text-sm text-slate-600 dark:text-slate-300">{user.email ?? 'No email'}</p>
          <span className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset bg-slate-100 text-slate-700 ring-slate-200">
            {user.role ?? 'Unknown'}
          </span>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => {
            void signOut({ callbackUrl: '/login' });
          }}
        >
          Sign out
        </Button>
      </div>
    </div>
  );
}
