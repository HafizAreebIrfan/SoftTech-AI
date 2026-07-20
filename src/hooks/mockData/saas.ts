import { SaaSPlan, SaaSMember, SaaSInvoice, SaaSUsage, SaaSClientAccount, SaaSProviderKPI } from "../../types/saas";

export const SAAS_PLANS: SaaSPlan[] = [
  {
    id: "free",
    name: "Free Trial",
    price: 0,
    billingInterval: "monthly",
    features: [
      "1 Team Seat Included",
      "1 GB Storage Limit",
      "500 API Calls per Month",
      "Community Forum Support"
    ],
    popular: false,
    limits: { seats: 1, storageGb: 1, apiCalls: 500 }
  },
  {
    id: "starter",
    name: "Startup Plan",
    price: 29,
    billingInterval: "monthly",
    features: [
      "5 Team Seats Included",
      "20 GB Cloud Storage",
      "10,000 API Calls per Month",
      "Standard Email Support",
      "API Dashboard Analytics"
    ],
    popular: false,
    limits: { seats: 5, storageGb: 20, apiCalls: 10000 }
  },
  {
    id: "pro",
    name: "Pro Scale",
    price: 99,
    billingInterval: "monthly",
    features: [
      "15 Team Seats Included",
      "100 GB Cloud Storage",
      "100,000 API Calls per Month",
      "Priority 24/7 Support",
      "Advanced Audit Logs",
      "Custom Webhooks Integration"
    ],
    popular: true,
    limits: { seats: 15, storageGb: 100, apiCalls: 100000 }
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 299,
    billingInterval: "monthly",
    features: [
      "Unlimited Team Seats",
      "1 TB Cloud Storage",
      "Unlimited API Calls",
      "Dedicated Account Manager",
      "SLA Guarantee (99.99%)",
      "SSO & SAML Security"
    ],
    popular: false,
    limits: { seats: 999, storageGb: 1000, apiCalls: 9999999 }
  }
];

export const INITIAL_USAGE: SaaSUsage = {
  seats: { current: 4, max: 5 },
  storageGb: { current: 14, max: 20 },
  apiCalls: { current: 8200, max: 10000 }
};

export const INITIAL_MEMBERS: SaaSMember[] = [
  {
    id: "mem-1",
    name: "Alex Mercer",
    email: "alex.mercer@devscale.io",
    role: "Owner",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&fit=crop",
    status: "active"
  },
  {
    id: "mem-2",
    name: "Sarah Connor",
    email: "sarah.c@devscale.io",
    role: "Admin",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&fit=crop",
    status: "active"
  },
  {
    id: "mem-3",
    name: "John Doe",
    email: "john.doe@devscale.io",
    role: "Member",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&fit=crop",
    status: "active"
  },
  {
    id: "mem-4",
    name: "Jane Miller",
    email: "jane.miller@devscale.io",
    role: "Viewer",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&fit=crop",
    status: "invited"
  }
];

export const INITIAL_INVOICES: SaaSInvoice[] = [
  { id: "INV-2026-004", date: "July 15, 2026", amount: 29, status: "Paid" },
  { id: "INV-2026-003", date: "June 15, 2026", amount: 29, status: "Paid" },
  { id: "INV-2026-002", date: "May 15, 2026", amount: 29, status: "Paid" }
];

export const saasMock = {
  title: "SaaS Admin Control Center",
  subtitle: "Manage billing limits, team seats, and invoices",
  layout: "list",
  blocks: [] as any[]
};

export const INITIAL_CLIENTS: SaaSClientAccount[] = [
  {
    id: "cli-1",
    companyName: "Acme Corporation",
    ownerName: "Thomas Anderson",
    ownerEmail: "neo@acme.com",
    planId: "enterprise",
    status: "active",
    monthlySpend: 299,
    joinDate: "Jan 12, 2026"
  },
  {
    id: "cli-2",
    companyName: "Cyberdyne Systems",
    ownerName: "Sarah Connor",
    ownerEmail: "connor@cyberdyne.io",
    planId: "pro",
    status: "active",
    monthlySpend: 99,
    joinDate: "Mar 22, 2026"
  },
  {
    id: "cli-3",
    companyName: "Stark Industries",
    ownerName: "Tony Stark",
    ownerEmail: "tony@stark.com",
    planId: "enterprise",
    status: "active",
    monthlySpend: 299,
    joinDate: "Feb 05, 2026"
  },
  {
    id: "cli-4",
    companyName: "Wayne Enterprises",
    ownerName: "Bruce Wayne",
    ownerEmail: "bruce@wayne.com",
    planId: "starter",
    status: "trialing",
    monthlySpend: 29,
    joinDate: "Jul 01, 2026"
  },
  {
    id: "cli-5",
    companyName: "Tyrell Corporation",
    ownerName: "Eldon Tyrell",
    ownerEmail: "eldon@tyrell.io",
    planId: "pro",
    status: "suspended",
    monthlySpend: 99,
    joinDate: "May 19, 2026"
  }
];

export const INITIAL_PROVIDER_KPIS: SaaSProviderKPI[] = [
  {
    id: "kpi-mrr",
    label: "Monthly Recurring Revenue",
    value: "$142,850",
    change: "+12.4% vs last month",
    isPositive: true
  },
  {
    id: "kpi-subs",
    label: "Active Subscriptions",
    value: "1,248 Accounts",
    change: "+8.2% vs last month",
    isPositive: true
  },
  {
    id: "kpi-churn",
    label: "Monthly Churn Rate",
    value: "1.84%",
    change: "-0.45% vs last month",
    isPositive: true
  }
];
