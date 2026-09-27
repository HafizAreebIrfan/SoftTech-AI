import { create } from "zustand";
import { LoginStore } from "../../interfaces/login.interface";

export const useLoginStore = create<LoginStore>((set) => ({
  email: "",
  password: "",
  showPassword: false,
  setShowPassword: (showPassword) => set({ showPassword }),
  togglepasswordvis: (prev: boolean) => set({ showPassword: !prev }),
  setEmail: (email) => set({ email }),
  setPassword: (password) => set({ password }),
  fillCredentials: (email) => set({ email, password: "password123" }),
  clearLogin: () => set({ email: "", password: "" }),
}));
