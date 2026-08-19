import { create } from "zustand";
import { LoginStore } from "../../interfaces/auth/login.interface";

export const useLoginStore = create<LoginStore>((set) => ({
  email: "",
  password: "",
  setEmail: (email) => set({ email }),
  setPassword: (password) => set({ password }),
  fillCredentials: (email) => set({ email, password: "password123" }),
  clearLogin: () => set({ email: "", password: "" }),
}));
