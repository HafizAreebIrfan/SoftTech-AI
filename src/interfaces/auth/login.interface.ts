export interface LoginStore {
  email: string;
  password: string;
  showPassword: boolean;
  setShowPassword: (showPassword: boolean) => void;
  togglepasswordvis: (prev: boolean) => void;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  fillCredentials: (email: string) => void;
  clearLogin: () => void;
}
