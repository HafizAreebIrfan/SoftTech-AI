export interface SaaSPlan {
  id: string;
  name: string;
  price: number;
  billingInterval: 'monthly' | 'yearly';
  features: string[];
  popular: boolean;
  limits: {
    seats: number;
    storageGb: number;
    apiCalls: number;
  };
}

export interface SaaSMember {
  id: string;
  name: string;
  email: string;
  role: 'Owner' | 'Admin' | 'Member' | 'Viewer';
  avatar?: string;
  status: 'active' | 'invited';
}

export interface SaaSUsageMetric {
  current: number;
  max: number;
}

export interface SaaSUsage {
  seats: SaaSUsageMetric;
  storageGb: SaaSUsageMetric;
  apiCalls: SaaSUsageMetric;
}

export interface SaaSInvoice {
  id: string;
  date: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Failed';
}

export interface SaaSClientAccount {
  id: string;
  companyName: string;
  ownerName: string;
  ownerEmail: string;
  planId: string;
  status: 'active' | 'suspended' | 'trialing';
  monthlySpend: number;
  joinDate: string;
}

export interface SaaSProviderKPI {
  id: string;
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
}

export interface SaaSStoreState {
  currentPlanId: string;
  billingInterval: 'monthly' | 'yearly';
  usage: SaaSUsage;
  members: SaaSMember[];
  invoices: SaaSInvoice[];
  cardBrand: string;
  cardLast4: string;
  nextBillingDate: string;
  perspective: 'subscriber' | 'provider';
  clientAccounts: SaaSClientAccount[];
  providerKPIs: SaaSProviderKPI[];
}
