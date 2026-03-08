import { LoginForm } from '@/components/auth/login-form';
import { Card } from '@/components/ui/card';

export default function LoginPage(): React.JSX.Element {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full max-w-md gap-6">
          <div className="text-center">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#2563EB] dark:text-[#60A5FA]">
              Dark Fabrik
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
              Client Portal
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Sign in to access your tenant workspace.
            </p>
          </div>
          <Card className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
            <LoginForm />
          </Card>
          <p className="text-center text-xs text-slate-500 dark:text-slate-400">
            Protected by secure authentication and tenant-aware access controls.
          </p>
        </div>
      </div>
    </div>
  );
}
