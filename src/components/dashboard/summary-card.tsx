type SummaryCardProps = {
  title: string;
  value: string;
  description: string;
};

export function SummaryCard({ title, value, description }: SummaryCardProps): React.JSX.Element {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 md:p-5">
      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{value}</p>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
    </div>
  );
}
