export function DashboardHeader(): React.JSX.Element {
  return (
    <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:border-slate-800 dark:bg-slate-950/95 md:px-6">
      <div className="flex min-w-0 flex-col">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Workspace</span>
        <h1 className="truncate text-lg font-semibold text-slate-900 dark:text-slate-100">Dashboard</h1>
      </div>
      <div className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
        Signed in
      </div>
    </header>
  );
}
