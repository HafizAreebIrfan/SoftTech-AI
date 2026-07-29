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
import Dashboard from "../../presentation/screens/private/Dashboard";
import NotFound from "../../presentation/screens/public/NotFound";
import ServiceUnavailable from "../../presentation/screens/public/ServiceUnavailable";
import PublicLayout from "../../presentation/layouts/PublicLayout";
import AuthLayout from "../../presentation/layouts/AuthLayout";
import { useAuthStore } from "../store/authStore";
import DashboardPreview from "../../presentation/screens/public/PreviewDashboard";
import AdminPreview from "../../presentation/screens/public/AdminPreview";

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

const dashboardPreviewRoute = createRoute({
  getParentRoute: () => publicLayout,
  path: "/dashboard-preview",
  component: DashboardPreview,
});

const adminPreviewRoute = createRoute({
  getParentRoute: () => publicLayout,
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
  publicLayout.addChildren([indexRoute, dashboardPreviewRoute, adminPreviewRoute]),
  authLayout.addChildren([
    loginRoute,
    signupRoute.addChildren([
      signupIndexRoute,
      signupStep1Route,
      signupStep2Route,
      signupStep3Route,
    ]),
  ]),
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
