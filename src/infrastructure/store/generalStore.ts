import { create } from "zustand";
import { BusinessInvoice, BusinessTeamMember } from "../../types/general";

interface GeneralState {
  perspective: 'subscriber' | 'provider';
  invoices: BusinessInvoice[];
  teamMembers: BusinessTeamMember[];
  invoiceModalOpen: boolean;
  globalMetrics: {
    revenue: number;
    expenses: number;
    margin: number;
    growth: number;
  };

  // Actions
  setPerspective: (val: 'subscriber' | 'provider') => void;
  openInvoiceModal: () => void;
  closeInvoiceModal: () => void;
  
  createInvoice: (clientName: string, amount: number, dueDate: string) => void;
  updateInvoiceStatus: (id: string, status: BusinessInvoice['status']) => void;
  deleteInvoice: (id: string) => void;
  toggleTeamMemberStatus: (id: string) => void;
  resetStore: () => void;
}

const INITIAL_INVOICES: BusinessInvoice[] = [
  { id: "inv_1", clientName: "Acme Corp Ltd", amount: 4850.00, dueDate: "2026-07-28", status: "Unpaid" },
  { id: "inv_2", clientName: "Stark Industries", amount: 15200.00, dueDate: "2026-07-15", status: "Paid" },
  { id: "inv_3", clientName: "Wayne Enterprise", amount: 9400.00, dueDate: "2026-07-02", status: "Overdue" }
];

const INITIAL_TEAM: BusinessTeamMember[] = [
  { id: "tm_1", name: "Tony Stark", role: "Chief Architect", email: "tony@stark.com", status: "Active" },
  { id: "tm_2", name: "Bruce Wayne", role: "Risk Analyst", email: "bruce@wayne.com", status: "Active" },
  { id: "tm_3", name: "Clark Kent", role: "Public Relations", email: "clark@dailyplanet.com", status: "Offline" }
];

export const useGeneralStore = create<GeneralState>((set, get) => ({
  perspective: 'subscriber',
  invoices: INITIAL_INVOICES,
  teamMembers: INITIAL_TEAM,
  invoiceModalOpen: false,
  globalMetrics: {
    revenue: 148200,
    expenses: 82400,
    margin: 44.4,
    growth: 12.4
  },

  setPerspective: (val) => set({ perspective: val }),
  openInvoiceModal: () => set({ invoiceModalOpen: true }),
  closeInvoiceModal: () => set({ invoiceModalOpen: false }),

  createInvoice: (clientName, amount, dueDate) => {
    const { invoices } = get();
    const newInvoice: BusinessInvoice = {
      id: `inv_${Date.now()}`,
      clientName,
      amount,
      dueDate,
      status: "Unpaid"
    };
    set({
      invoices: [...invoices, newInvoice],
      invoiceModalOpen: false
    });
  },

  updateInvoiceStatus: (id, status) => {
    const { invoices } = get();
    set({
      invoices: invoices.map((inv) => inv.id === id ? { ...inv, status } : inv)
    });
  },

  deleteInvoice: (id) => {
    const { invoices } = get();
    set({
      invoices: invoices.filter((inv) => inv.id !== id)
    });
  },

  toggleTeamMemberStatus: (id) => {
    const { teamMembers } = get();
    set({
      teamMembers: teamMembers.map((tm) => tm.id === id ? { ...tm, status: tm.status === "Active" ? "Offline" : "Active" } : tm)
    });
  },

  resetStore: () => set({
    perspective: 'subscriber',
    invoices: INITIAL_INVOICES,
    teamMembers: INITIAL_TEAM,
    invoiceModalOpen: false,
    globalMetrics: {
      revenue: 148200,
      expenses: 82400,
      margin: 44.4,
      growth: 12.4
    }
  })
}));
