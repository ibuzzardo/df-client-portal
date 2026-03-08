import { NextResponse } from 'next/server';

import { getDashboardData } from '@/lib/dashboard-data';

export async function GET(): Promise<Response> {
  try {
    const dashboardData = await getDashboardData();

    return NextResponse.json(
      {
        data: {
          summaryCards: dashboardData.summaryCards,
          recentRecords: dashboardData.recentRecords,
        },
        error: null,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        data: null,
        error: {
          message: error instanceof Error ? error.message : 'Failed to load dashboard data',
        },
      },
      { status: 500 },
    );
  }
}
