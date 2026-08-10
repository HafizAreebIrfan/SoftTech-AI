export interface LoginStore {
  email: string;
  password: string;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  fillCredentials: (email: string) => void;
  clearLogin: () => void;
}
