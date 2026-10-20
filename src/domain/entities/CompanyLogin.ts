export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  isSignupOnboardingDone?: boolean;
  signupOnboardingStep?: number;
  onboardingStep?: number;
  status?: string;
  mcpSlug?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user?: User;
  message?: string;
}
