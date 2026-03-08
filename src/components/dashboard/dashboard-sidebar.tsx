import Link from 'next/link';
import { BarChart3, FolderKanban, LayoutDashboard, Receipt, Users } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/clients', label: 'Clients', icon: Users },
  { href: '/dashboard/projects', label: 'Projects', icon: FolderKanban },
  { href: '/dashboard/invoices', label: 'Invoices', icon: Receipt },
  { href: '/dashboard/reports', label: 'Reports', icon: BarChart3 },
];

export function DashboardSidebar(): React.JSX.Element {
  return (
    <div className="flex h-full w-full flex-col border-r border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
      <div className="mb-6 px-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Dark Fabrik</p>
        <h2 className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">Client Portal</h2>
      </div>
      <nav className="flex flex-col gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/30 active:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-slate-100"
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
