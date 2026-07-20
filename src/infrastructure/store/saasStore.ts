import { create } from "zustand";
import { SaaSUsage, SaaSMember, SaaSInvoice, SaaSPlan, SaaSClientAccount, SaaSProviderKPI } from "../../types/saas";
import { SAAS_PLANS, INITIAL_USAGE, INITIAL_MEMBERS, INITIAL_INVOICES, INITIAL_CLIENTS, INITIAL_PROVIDER_KPIS } from "../../hooks/mockData/saas";

interface SaaSStore {
  currentPlanId: string;
  billingInterval: "monthly" | "yearly";
  usage: SaaSUsage;
  members: SaaSMember[];
  invoices: SaaSInvoice[];
  cardBrand: string;
  cardLast4: string;
  nextBillingDate: string;
  
  // Perspective states
  perspective: "subscriber" | "provider";
  clientAccounts: SaaSClientAccount[];
  providerKPIs: SaaSProviderKPI[];
  
  // Actions
  setBillingInterval: (interval: "monthly" | "yearly") => void;
  upgradePlan: (planId: string) => void;
  addMember: (name: string, email: string, role: SaaSMember["role"]) => void;
  removeMember: (id: string) => void;
  changeMemberRole: (id: string, role: SaaSMember["role"]) => void;
  updateCard: (brand: string, last4: string) => void;
  resetStore: () => void;
  
  // Provider actions
  setPerspective: (perspective: "subscriber" | "provider") => void;
  addClientAccount: (companyName: string, ownerName: string, ownerEmail: string, planId: string) => void;
  toggleClientStatus: (id: string) => void;
  changeClientPlan: (id: string, planId: string) => void;
}

export const useSaaSStore = create<SaaSStore>((set) => ({
  currentPlanId: "starter",
  billingInterval: "monthly",
  usage: INITIAL_USAGE,
  members: INITIAL_MEMBERS,
  invoices: INITIAL_INVOICES,
  cardBrand: "Visa",
  cardLast4: "4242",
  nextBillingDate: "August 15, 2026",
  perspective: "subscriber",
  clientAccounts: INITIAL_CLIENTS,
  providerKPIs: INITIAL_PROVIDER_KPIS,

  setBillingInterval: (billingInterval) => set({ billingInterval }),
  
  upgradePlan: (planId) => set((state) => {
    const selectedPlan = SAAS_PLANS.find(p => p.id === planId);
    if (!selectedPlan) return {};
    
    // Dynamically update the usage limit based on the upgraded plan
    const newMaxSeats = selectedPlan.limits.seats;
    const newMaxStorage = selectedPlan.limits.storageGb;
    const newMaxApiCalls = selectedPlan.limits.apiCalls;

    return {
      currentPlanId: planId,
      usage: {
        seats: { ...state.usage.seats, max: newMaxSeats },
        storageGb: { ...state.usage.storageGb, max: newMaxStorage },
        apiCalls: { ...state.usage.apiCalls, max: newMaxApiCalls }
      }
    };
  }),

  addMember: (name, email, role) => set((state) => {
    const currentActiveSeats = state.members.filter(m => m.status === "active").length;
    const maxSeats = state.usage.seats.max;

    // Check if adding another seat exceeds the plan limit
    if (currentActiveSeats >= maxSeats) {
      alert(`Seat limit reached for your current plan (${maxSeats} seats). Please upgrade your subscription.`);
      return {};
    }

    const newMember: SaaSMember = {
      id: `mem-${Date.now()}`,
      name,
      email,
      role,
      avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 900000)}?w=100&fit=crop`,
      status: "invited"
    };

    const updatedMembers = [...state.members, newMember];
    return {
      members: updatedMembers,
      usage: {
        ...state.usage,
        seats: {
          ...state.usage.seats,
          current: updatedMembers.length
        }
      }
    };
  }),

  removeMember: (id) => set((state) => {
    const updatedMembers = state.members.filter(m => m.id !== id);
    return {
      members: updatedMembers,
      usage: {
        ...state.usage,
        seats: {
          ...state.usage.seats,
          current: updatedMembers.length
        }
      }
    };
  }),

  changeMemberRole: (id, role) => set((state) => ({
    members: state.members.map((m) => m.id === id ? { ...m, role } : m)
  })),

  updateCard: (cardBrand, cardLast4) => set({ cardBrand, cardLast4 }),

  setPerspective: (perspective) => set({ perspective }),

  addClientAccount: (companyName, ownerName, ownerEmail, planId) => set((state) => {
    const selectedPlan = SAAS_PLANS.find(p => p.id === planId) || SAAS_PLANS[1];
    const newClient: SaaSClientAccount = {
      id: `cli-${Date.now()}`,
      companyName,
      ownerName,
      ownerEmail,
      planId,
      status: "active",
      monthlySpend: selectedPlan.price,
      joinDate: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
    };
    return {
      clientAccounts: [...state.clientAccounts, newClient]
    };
  }),

  toggleClientStatus: (id) => set((state) => ({
    clientAccounts: state.clientAccounts.map((c) =>
      c.id === id ? { ...c, status: c.status === "active" ? "suspended" : "active" } : c
    )
  })),

  changeClientPlan: (id, planId) => set((state) => {
    const selectedPlan = SAAS_PLANS.find(p => p.id === planId);
    if (!selectedPlan) return {};
    return {
      clientAccounts: state.clientAccounts.map((c) =>
        c.id === id ? { ...c, planId, monthlySpend: selectedPlan.price } : c
      )
    };
  }),

  resetStore: () => set({
    currentPlanId: "starter",
    billingInterval: "monthly",
    usage: INITIAL_USAGE,
    members: INITIAL_MEMBERS,
    invoices: INITIAL_INVOICES,
    cardBrand: "Visa",
    cardLast4: "4242",
    nextBillingDate: "August 15, 2026",
    perspective: "subscriber",
    clientAccounts: INITIAL_CLIENTS,
    providerKPIs: INITIAL_PROVIDER_KPIS
  })
}));
