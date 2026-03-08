export type DashboardSummary = {
  totalClients: number;
  activeProjects: number;
  outstandingInvoices: number;
  totalRevenueCents: number;
};

export type BusinessRecord = {
  id: string;
  type: 'client' | 'project' | 'invoice';
  title: string;
  subtitle: string;
  status: string;
  createdAt: string;
};

export type DashboardData = {
  summary: DashboardSummary;
  recentRecords: BusinessRecord[];
};
