import { getDashboardData } from '@/lib/dashboard-data';

export default async function DashboardPage(): Promise<React.JSX.Element> {
  const dashboardData = await getDashboardData();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Dashboard
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Overview of clients, projects, invoices, and recent activity.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardData.summaryCards.map((card) => (
          <div
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 md:p-5"
            key={card.label}
          >
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{card.value}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{card.description}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-slate-900 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 md:p-6 xl:col-span-2">
          <section className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Recent business records
            </h2>
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">View all</span>
          </section>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full caption-bottom text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3 text-left font-medium text-slate-600 dark:text-slate-400">Name</th>
                  <th className="py-3 text-left font-medium text-slate-600 dark:text-slate-400">Type</th>
                  <th className="py-3 text-left font-medium text-slate-600 dark:text-slate-400">Status</th>
                  <th className="py-3 text-left font-medium text-slate-600 dark:text-slate-400">Updated</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.recentRecords.map((record) => (
                  <tr className="border-b border-slate-100 dark:border-slate-800" key={record.id}>
                    <td className="py-3 text-slate-900 dark:text-slate-100">{record.name}</td>
                    <td className="py-3 text-slate-600 dark:text-slate-400">{record.type}</td>
                    <td className="py-3">
                      <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ring-slate-300 dark:ring-slate-700">
                        {record.status}
                      </span>
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-400">{record.updatedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 text-slate-900 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 md:p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Quick actions</h2>
          <div className="mt-4 flex flex-col gap-3">
            <button
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] hover:bg-blue-700"
              type="button"
            >
              Create record
            </button>
            <button
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
              type="button"
            >
              Export data
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 text-slate-900 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 md:p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Upcoming modules</h2>
        <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-950">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">More modules coming soon</p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            CRM, reporting, and workflow tools will appear here in future sprints.
          </p>
        </div>
      </div>
    </div>
  );
}
