import React from "react";
import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import Homescreen from "../../presentation/screens/public/Marketing/home";
import Login from "../../presentation/screens/auth/Login";
import Signup from "../../presentation/screens/auth/Signup";
import SignupStep1 from "../../presentation/screens/auth/Signup/Step1";
import SignupStep2 from "../../presentation/screens/auth/Signup/Step2";
import SignupStep3 from "../../presentation/screens/auth/Signup/Step3";
import ForgotPassword from "../../presentation/screens/auth/ForgotPassword";
import ForgotPasswordStep1 from "../../presentation/screens/auth/ForgotPassword/Step1";
import ForgotPasswordStep2 from "../../presentation/screens/auth/ForgotPassword/Step2";
import ForgotPasswordStep3 from "../../presentation/screens/auth/ForgotPassword/Step3";
import Dashboard from "../../presentation/screens/private/Dashboard";
import NotFound from "../../presentation/screens/public/NotFound";
import ServiceUnavailable from "../../presentation/screens/public/ServiceUnavailable";
import PublicLayout from "../../presentation/layouts/PublicLayout";
import AuthLayout from "../../presentation/layouts/AuthLayout";
import { useAuthStore } from "../store/authStore";
import AdminPreview from "../../presentation/screens/public/AdminPreview";
import ProcessingIntegration from "../../presentation/screens/integration/ProcessingIntegration";
import IntegrationSuccess from "../../presentation/screens/integration/IntegrationSuccess";
import OnboardingDashboard from "../../presentation/screens/onboarding/OnboardingDashboard";
import Plans from "../../presentation/screens/company/Plans";
import Checkout from "../../presentation/screens/company/Checkout";
import PaymentResult from "../../presentation/screens/company/PaymentResult";
import Deployment from "../../presentation/screens/company/Deployment";
import DeploymentInProgress from "../../presentation/screens/company/DeploymentInProgress";

// 1. Establish the absolute root route (renders an Outlet container)
const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

// 2. Establish pathless layout routes
const publicLayout = createRoute({
  getParentRoute: () => rootRoute,
  id: "_public", // Prefix with underscore for pathless layout
  component: PublicLayout,
});

const authLayout = createRoute({
  getParentRoute: () => rootRoute,
  id: "_auth", // Prefix with underscore for pathless layout
  component: AuthLayout,
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (isAuthenticated) {
      throw redirect({ to: "/dashboard" });
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
  path: "/admin-preview",
  component: AdminPreview,
});

const loginRoute = createRoute({
  getParentRoute: () => authLayout,
  path: "/login",
  component: Login,
});


const signupRoute = createRoute({
  getParentRoute: () => authLayout,
  path: "/signup",
  component: Signup,
});

const signupIndexRoute = createRoute({
  getParentRoute: () => signupRoute,
  path: "/",
  loader: () => {
    throw redirect({ to: "/signup/step1" });
  },
});

const signupStep1Route = createRoute({
  getParentRoute: () => signupRoute,
  path: "/step1",
  component: SignupStep1,
});

const signupStep2Route = createRoute({
  getParentRoute: () => signupRoute,
  path: "/step2",
  component: SignupStep2,
});

const signupStep3Route = createRoute({
  getParentRoute: () => signupRoute,
  path: "/step3",
  component: SignupStep3,
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

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: Dashboard,
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: "/login" });
    }
  },
});

const processingIntegrationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/processing-integration",
  component: ProcessingIntegration,
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: "/login" });
    }
  },
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
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: "/login" });
    }
  },
});

const plansSofttechRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/plans_softtech_ai_updated",
  component: Plans,
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: "/login" });
    }
  },
});

const checkoutSofttechRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/checkout_softtech_ai_refined",
  component: Checkout,
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: "/login" });
    }
  },
});

const paymentResultSofttechRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/payment_result_softtech_ai_updated",
  component: PaymentResult,
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: "/login" });
    }
  },
});

const deploymentSofttechRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/deployment_softtech_ai_refined",
  component: Deployment,
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: "/login" });
    }
  },
});

const deploymentInProgressSofttechRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/deployment_in_progress_softtech_ai",
  component: DeploymentInProgress,
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: "/login" });
    }
  },
});

const notFoundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/404",
  component: NotFound,
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
    signupRoute.addChildren([
      signupIndexRoute,
      signupStep1Route,
      signupStep2Route,
      signupStep3Route,
    ]),
    forgotPasswordRoute.addChildren([
      forgotPasswordIndexRoute,
      forgotPasswordStep1Route,
      forgotPasswordStep2Route,
      forgotPasswordStep3Route,
    ]),
  ]),
  processingIntegrationRoute,
  integrationSuccessRoute,
  onboardingDashboardRoute,
  plansSofttechRoute,
  checkoutSofttechRoute,
  paymentResultSofttechRoute,
  deploymentSofttechRoute,
  deploymentInProgressSofttechRoute,
  dashboardRoute,
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
