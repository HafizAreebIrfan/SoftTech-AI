import { env } from "../../infrastructure/config/env";
import { get, post } from "./httpClient";

const baseUrl = env.isDev ? env.apiBaseUrlLocal : env.apiBaseUrl;

export interface AdminDashboardStats {
  totalCompanies: number;
  publishedCompanies: number;
  onboardingCompanies: number;
  lifetimeEarnings: number;
  revenueThisYear: number;
  revenueByYear?: Record<number, number>;
  statusBreakdown?: Record<string, number>;
}

export interface AdminCompanyItem {
  id?: string;
  _id?: string;
  name?: string;
  companyName?: string;
  email: string;
  industry?: string;
  plan?: string;
  currentPlan?: string;
  status: string;
  apisCount?: number;
  apis?: any[];
  onboardingStep?: number;
  createdAt?: string;
  updatedAt?: string;
  role?: string;
  owner?: string;
  apiCount?: number;
}

export interface AdminLogItem {
  _id?: string;
  method: string;
  path: string;
  ip: string;
  timestamp: string;
  userAgent?: string;
  responseTime?: number;
  statusCode?: number;
}

export interface SystemHealthData {
  uptime: number;
  uptimeFormatted?: string;
  memory: {
    rss: number | string;
    heapTotal: number | string;
    heapUsed: number | string;
    external: number | string;
    rssFormatted?: string;
    heapTotalFormatted?: string;
    heapUsedFormatted?: string;
  };
  database: {
    status: string;
    readyState: number;
    connected?: boolean;
  };
  totalRequests: number;
  requests?: {
    total: number;
  };
}

export const getAdminStats = async (): Promise<{
  success: boolean;
  data: AdminDashboardStats;
}> => {
  return get(`${baseUrl}/api/admin/dashboard/stats`, { skipRedirect: true });
};

export const getAdminSummary = async (): Promise<{
  success: boolean;
  data: {
    totalCompanies: number;
    lifetimeEarnings: number;
    revenueThisYear: number;
    publishedCompanies: number;
    onboardingCompanies: number;
  };
}> => {
  return get(`${baseUrl}/api/admin/dashboard/summary`, { skipRedirect: true });
};

export const getAdminTopCompanies = async (
  limit = 5,
): Promise<{
  success: boolean;
  data: AdminCompanyItem[];
}> => {
  return get(`${baseUrl}/api/admin/dashboard/top-companies?limit=${limit}`, {
    skipRedirect: true,
  });
};

export const getAdminAllCompanies = async (): Promise<{
  success: boolean;
  data: AdminCompanyItem[];
}> => {
  return get(`${baseUrl}/api/admin/dashboard/all-companies`, {
    skipRedirect: true,
  });
};

export const getAdminCompanyDetail = async (
  companyId: string,
): Promise<{
  success: boolean;
  data: any;
}> => {
  return get(`${baseUrl}/api/admin/dashboard/${companyId}`, {
    skipRedirect: true,
  });
};

export const getAdminCharts = async (): Promise<{
  success: boolean;
  data: {
    revenueByYear: Record<number, number>;
    companyGrowthByYear: Record<number, number>;
  };
}> => {
  return get(`${baseUrl}/api/admin/dashboard/charts`, { skipRedirect: true });
};

export const getAdminLogs = async (): Promise<{
  success: boolean;
  data: AdminLogItem[];
}> => {
  return get(`${baseUrl}/api/admin/logs`, { skipRedirect: true });
};

export const getAdminHealth = async (): Promise<{
  success: boolean;
  data: SystemHealthData;
}> => {
  return get(`${baseUrl}/api/admin/health`, { skipRedirect: true });
};

export const getAdminMe = async (): Promise<{
  success: boolean;
  user: any;
}> => {
  return get(`${baseUrl}/api/admin/me`, { skipRedirect: true });
};

export const updateAdminCompanyRole = async (
  companyId: string,
  role: "admin" | "company" | "user",
): Promise<{
  success: boolean;
  message?: string;
  company?: any;
}> => {
  try {
    const res = await fetch(`${baseUrl}/api/admin/companies/${companyId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
      credentials: "include",
    });
    return res.json();
  } catch (err: any) {
    throw err;
  }
};
