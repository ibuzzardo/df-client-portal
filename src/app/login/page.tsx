import { redirect } from 'next/navigation';

import { getAuthSession } from '@/lib/auth';

export default async function LoginPage(): Promise<React.JSX.Element> {
  const session = await getAuthSession();

  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 md:p-8">
        <div className="mb-6 space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Client Portal
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Sign in to access your dashboard.
          </p>
        </div>
        <form className="space-y-4">
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-slate-900 dark:text-slate-100"
              htmlFor="email"
            >
              Email
            </label>
            <input
              className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:border-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/30 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              id="email"
              name="email"
              placeholder="you@example.com"
              type="email"
            />
          </div>
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-slate-900 dark:text-slate-100"
              htmlFor="password"
            >
              Password
            </label>
            <input
              className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:border-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/30 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              id="password"
              name="password"
              type="password"
            />
          </div>
          <button
            className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] hover:bg-blue-700"
            type="submit"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
