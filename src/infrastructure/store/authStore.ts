import { create } from "zustand";

type UserStore = {
  username: string;
  useremail: string;
  userphone: string;
  userdatetime: string;
  setUsername: (name: string) => void;
  setUseremail: (email: string) => void;
  setUserphone: (phone: string) => void;
  setUserdatetime: (datetime: string) => void;
  resetUser: () => void;
};

export const useUserStore = create<UserStore>((set) => ({
  username: "",
  useremail: "",
  userphone: "",
  userdatetime: "",
  setUsername: (name) => set({ username: name }),
  setUseremail: (email) => set({ useremail: email }),
  setUserphone: (phone) => set({ userphone: phone }),
  setUserdatetime: (datetime) => set({ userdatetime: datetime }),
  resetUser: () => set({ username: "", useremail: "", userphone: "", userdatetime: "" }),
}));
