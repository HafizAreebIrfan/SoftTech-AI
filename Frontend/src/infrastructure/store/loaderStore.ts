import { create } from "zustand";

type LoaderStore = {
  showloader: boolean;
  setShowloader: (show: boolean) => void;
};

export const useLoaderStore = create<LoaderStore>((set) => ({
  showloader: false,
  setShowloader: (show) => set({ showloader: show }),
}));
