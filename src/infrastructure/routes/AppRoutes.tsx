import React from "react";
import {
  createRouter,
  createRoute,
  createRootRoute,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import Homescreen from "../../presentation/screens/public/Marketing/home";
import Login from "../../presentation/screens/auth/Login";
import Signup from "../../presentation/screens/auth/Signup";
import SignupStep1 from "../../presentation/screens/auth/Signup/Step1";
import SignupSuccess from "../../presentation/screens/auth/Signup/SignupSuccess";
import ForgotPassword from "../../presentation/screens/auth/ForgotPassword";
import ForgotPasswordStep1 from "../../presentation/screens/auth/ForgotPassword/Step1";
import ForgotPasswordStep2 from "../../presentation/screens/auth/ForgotPassword/Step2";
import ForgotPasswordStep3 from "../../presentation/screens/auth/ForgotPassword/Step3";
import CompanyDashboard from "../../presentation/screens/company/CompanyDashboard/index";
import NotFound from "../../presentation/screens/public/NotFound";
import ServiceUnavailable from "../../presentation/screens/public/ServiceUnavailable";
import PublicLayout from "../../presentation/layouts/PublicLayout";
import AuthLayout from "../../presentation/layouts/AuthLayout";
import CheckoutDummy from "../../presentation/screens/public/DummyPages/checkoutdummy";
import { useAuthStore } from "../store/authStore";
import { useSignupStore } from "../store/signupStore";
import AdminPreview from "../../presentation/screens/admin/AdminPreview";
import IntegrationSuccess from "../../presentation/screens/onboarding/IntegrationSuccess";
import OnboardingDashboard from "../../presentation/screens/onboarding/OnboardingDashboard";
import McpSimulation from "../../presentation/screens/onboarding/McpSimulation";
import Plans from "../../presentation/screens/onboarding/Plans";
import Checkout from "../../presentation/screens/onboarding/Checkout";
import PaymentResult from "../../presentation/screens/onboarding/PaymentResult";
import Deployment from "../../presentation/screens/onboarding/Deployment";
import DeploymentInProgress from "../../presentation/screens/onboarding/DeploymentInProgress";
import Upgrade from "../../presentation/screens/onboarding/Upgrade";
import ApiManagement from "../../presentation/screens/company/ApiManagement";
import CompanyAnalytics from "../../presentation/screens/company/CompanyAnalytics";
import Profile from "../../presentation/screens/company/Profile";
import OnboardingSuccess from "../../presentation/screens/auth/Signup/Onboarding/OnboardingSuccess";
import OnboardingStep1 from "../../presentation/screens/auth/Signup/Onboarding/OnboardingStep1";
import OnboardingStep2 from "../../presentation/screens/auth/Signup/Onboarding/OnboardingStep2";

// 1. Establish the absolute root route (renders an Outlet container)
const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

// 2. Establish layouts (Pathless / Layout Routes)
const publicLayout = createRoute({
  getParentRoute: () => rootRoute,
  id: "_public", // Prefix with underscore for pathless layout
  component: PublicLayout,
});

const getOnboardingRedirect = () => {
  const { isAuthenticated, user } = useAuthStore.getState();
  const { isSignupOnboardingDone, signupOnboardingStep } =
    useSignupStore.getState();

  if (!isAuthenticated) {
    return "/login";
  }

  if (user?.role === "admin") {
    return null;
  }

  const isSignupDone = Boolean(
    user?.isSignupOnboardingDone || isSignupOnboardingDone,
  );
  if (!isSignupDone) {
    const step = user?.signupOnboardingStep || signupOnboardingStep || 1;
    return step === 2 ? "/signup/onboarding-step2" : "/signup/onboarding-step1";
  }

  const isSecondDone = (user?.onboardingStep || 1) >= 4;
  if (!isSecondDone) {
    return "/onboarding_dashboard";
  }

  return null;
};

const authLayout = createRoute({
  getParentRoute: () => rootRoute,
  id: "_auth", // Prefix with underscore for pathless layout
  component: AuthLayout,
  beforeLoad: () => {
    const { isAuthenticated, user } = useAuthStore.getState();
    if (isAuthenticated) {
      if (user?.role === "admin") {
        throw redirect({ to: "/admin-dashboard" });
      }
      const redirectPath = getOnboardingRedirect();
      if (redirectPath && redirectPath !== "/login") {
        throw redirect({ to: redirectPath });
      }
      throw redirect({ to: "/company-dashboard" });
    }
  },
});

// 3. Configure concrete screens routes nested under their layouts
const indexRoute = createRoute({
  getParentRoute: () => publicLayout,
  path: "/",
  component: Homescreen,
});

const adminPreviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin-dashboard",
  component: AdminPreview,
  beforeLoad: () => {
    const { isAuthenticated, user } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: "/login" });
    }
    if (user?.role !== "admin") {
      throw redirect({ to: "/company-dashboard" });
    }
  },
});

const loginRoute = createRoute({
  getParentRoute: () => authLayout,
  path: "/login",
  component: Login,
});

const signupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/signup",
  component: Signup,
});

const signupIndexRoute = createRoute({
  getParentRoute: () => signupRoute,
  path: "/",
  loader: () => {
    throw redirect({ to: "/signup/company" });
  },
});

const signupStep1Route = createRoute({
  getParentRoute: () => signupRoute,
  path: "/company",
  component: SignupStep1,
  beforeLoad: () => {
    const { isAuthenticated, user } = useAuthStore.getState();
    if (isAuthenticated && user?.role !== "admin") {
      const redirectPath = getOnboardingRedirect();
      if (redirectPath && redirectPath !== "/login") {
        throw redirect({ to: redirectPath });
      }
      throw redirect({ to: "/company-dashboard" });
    }
  },
});

const signupOnboardingStep1 = createRoute({
  getParentRoute: () => signupRoute,
  path: "/onboarding-step1",
  component: OnboardingStep1,
  beforeLoad: () => {
    const { isAuthenticated, user } = useAuthStore.getState();
    const { companyId } = useSignupStore.getState();
    const effectiveCompanyId = companyId || user?.id;
    if (!isAuthenticated && !effectiveCompanyId) {
      throw redirect({ to: "/signup/company" });
    }
  },
});

const signupOnboardingStep2 = createRoute({
  getParentRoute: () => signupRoute,
  path: "/onboarding-step2",
  component: OnboardingStep2,
  beforeLoad: () => {
    const { companyId, apisList, signupOnboardingStep } =
      useSignupStore.getState();
    const { isAuthenticated, user } = useAuthStore.getState();
    const effectiveCompanyId = companyId || user?.id;
    if (!isAuthenticated && !effectiveCompanyId) {
      throw redirect({ to: "/signup/company" });
    }
    const isStep1Done =
      Boolean(effectiveCompanyId) &&
      (signupOnboardingStep >= 2 ||
        (typeof user?.signupOnboardingStep === "number" &&
          user.signupOnboardingStep >= 2) ||
        (apisList &&
          apisList.length > 0 &&
          apisList.some(
            (a) =>
              a.apiName?.trim() &&
              a.apiEndpoint?.trim() &&
              a.apiEndpoint !== "https://",
          )));
    if (!isStep1Done) {
      throw redirect({ to: "/signup/onboarding-step1" });
    }
  },
});

const SignupOnboardingSuccess = createRoute({
  getParentRoute: () => signupRoute,
  path: "/onboarding-success",
  component: OnboardingSuccess,
  beforeLoad: () => {
    const { companyId, apisList, signupOnboardingStep } =
      useSignupStore.getState();
    const { isAuthenticated, user } = useAuthStore.getState();
    const effectiveCompanyId = companyId || user?.id;
    if (!isAuthenticated && !effectiveCompanyId) {
      throw redirect({ to: "/signup/company" });
    }
    const isStep1Done =
      Boolean(effectiveCompanyId) &&
      (signupOnboardingStep >= 2 ||
        (typeof user?.signupOnboardingStep === "number" &&
          user.signupOnboardingStep >= 2) ||
        (apisList &&
          apisList.length > 0 &&
          apisList.some(
            (a) =>
              a.apiName?.trim() &&
              a.apiEndpoint?.trim() &&
              a.apiEndpoint !== "https://",
          )));
    if (!isStep1Done) {
      throw redirect({ to: "/signup/onboarding-step1" });
    }
  },
});

const signupSuccessRoute = createRoute({
  getParentRoute: () => signupRoute,
  path: "/success",
  component: SignupSuccess,
});

const forgotPasswordRoute = createRoute({
  getParentRoute: () => authLayout,
  path: "/forgot-password",
  component: ForgotPassword,
});

const forgotPasswordIndexRoute = createRoute({
  getParentRoute: () => forgotPasswordRoute,
  path: "/",
  loader: () => {
    throw redirect({ to: "/forgot-password/step1" });
  },
});

const forgotPasswordStep1Route = createRoute({
  getParentRoute: () => forgotPasswordRoute,
  path: "/step1",
  component: ForgotPasswordStep1,
});

const forgotPasswordStep2Route = createRoute({
  getParentRoute: () => forgotPasswordRoute,
  path: "/step2",
  component: ForgotPasswordStep2,
});

const forgotPasswordStep3Route = createRoute({
  getParentRoute: () => forgotPasswordRoute,
  path: "/step3",
  component: ForgotPasswordStep3,
});

const integrationSuccessRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/integration-success",
  component: IntegrationSuccess,
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: "/login" });
    }
  },
});

const onboardingDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/onboarding_dashboard",
  component: OnboardingDashboard,
  beforeLoad: () => {
    const { isAuthenticated, user } = useAuthStore.getState();
    const { isSignupOnboardingDone, signupOnboardingStep } =
      useSignupStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: "/login" });
    }
    if (user?.role === "admin") return;
    const isSignupDone = Boolean(
      user?.isSignupOnboardingDone || isSignupOnboardingDone,
    );
    if (!isSignupDone) {
      const step = user?.signupOnboardingStep || signupOnboardingStep || 1;
      throw redirect({
        to:
          step === 2 ? "/signup/onboarding-step2" : "/signup/onboarding-step1",
      });
    }
  },
});

const mcpSimulationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/mcp_simulation",
  component: McpSimulation,
  beforeLoad: () => {
    const { isAuthenticated, user } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: "/login" });
    }
    if ((user?.onboardingStep || 1) >= 4) {
      throw redirect({
        href: "/company-dashboard?tab=simulation",
      } as any);
    }
  },
});

const plans = createRoute({
  getParentRoute: () => rootRoute,
  path: "/plans",
  component: Plans,
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: "/login" });
    }
  },
});

const checkout = createRoute({
  getParentRoute: () => rootRoute,
  path: "/checkout",
  component: Checkout,
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: "/login" });
    }
  },
});

const checkoutDummy = createRoute({
  getParentRoute: () => rootRoute,
  path: "/checkoutdummy",
  component: CheckoutDummy,
});

const paymentResult = createRoute({
  getParentRoute: () => rootRoute,
  path: "/paymentresult",
  component: PaymentResult,
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: "/login" });
    }
  },
});

const deployment = createRoute({
  getParentRoute: () => rootRoute,
  path: "/deployment",
  component: Deployment,
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: "/login" });
    }
  },
});

const deploymentInProgress = createRoute({
  getParentRoute: () => rootRoute,
  path: "/deployment_in_progress",
  component: DeploymentInProgress,
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: "/login" });
    }
  },
});

const upgradeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/upgrade",
  component: Upgrade,
  beforeLoad: () => {
    const { isAuthenticated, user } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: "/login" });
    }
    if ((user?.onboardingStep || 1) >= 4) {
      throw redirect({
        href: "/company-dashboard?tab=upgrade",
      } as any);
    }
  },
});

const companyDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/company-dashboard",
  component: CompanyDashboard,
  beforeLoad: () => {
    const redirectPath = getOnboardingRedirect();
    if (redirectPath) {
      throw redirect({ to: redirectPath });
    }
  },
});

const apiManagementRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/api_management",
  component: ApiManagement,
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: "/login" });
    }
    throw redirect({
      href: "/company-dashboard?tab=apis",
    } as any);
  },
});

const companyAnalyticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/company_analytics",
  component: CompanyAnalytics,
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: "/login" });
    }
    throw redirect({
      href: "/company-dashboard?tab=analytics",
    } as any);
  },
});

const companyProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/company_profile",
  component: Profile,
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: "/login" });
    }
    throw redirect({
      href: "/company-dashboard?tab=settings",
    } as any);
  },
});

const notFoundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/404",
  component: NotFound,
});

import { PreviewApp } from "../../preview/PreviewApp";

const widgetPreviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/preview",
  component: PreviewApp,
});

const serviceUnavailableRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/503",
  component: ServiceUnavailable,
});

// 4. Assemble the unified route tree
const routeTree = rootRoute.addChildren([
  publicLayout.addChildren([indexRoute]),
  adminPreviewRoute,
  authLayout.addChildren([
    loginRoute,
    forgotPasswordRoute.addChildren([
      forgotPasswordIndexRoute,
      forgotPasswordStep1Route,
      forgotPasswordStep2Route,
      forgotPasswordStep3Route,
    ]),
  ]),
  signupRoute.addChildren([
    signupIndexRoute,
    signupStep1Route,
    signupSuccessRoute,
    signupOnboardingStep1,
    signupOnboardingStep2,
    SignupOnboardingSuccess,
  ]),
  integrationSuccessRoute,
  onboardingDashboardRoute,
  mcpSimulationRoute,
  plans,
  checkout,
  checkoutDummy,
  paymentResult,
  deployment,
  deploymentInProgress,
  upgradeRoute,
  companyDashboardRoute,
  apiManagementRoute,
  companyAnalyticsRoute,
  companyProfileRoute,
  widgetPreviewRoute,
  notFoundRoute,
  serviceUnavailableRoute,
]);

// 5. Create the unified router
export const router = createRouter({
  routeTree,
  defaultNotFoundComponent: NotFound,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
