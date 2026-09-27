import { create } from "zustand";

export interface CriticalErrorPayload {
  status: number;
  title: string;
  message: string;
  onRetry?: () => void;
}

export interface ErrorStore {
  error: CriticalErrorPayload | null;
  showErrorModal: (payload: CriticalErrorPayload) => void;
  clearError: () => void;
}

export const useErrorStore = create<ErrorStore>((set) => ({
  error: null,
  showErrorModal: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));
