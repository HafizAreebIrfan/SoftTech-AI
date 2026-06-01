import React from 'react';
import { createRootRoute, createRoute, createRouter, Outlet } from '@tanstack/react-router';
import Homescreen from '../../presentation/screens/public/Marketing/home';
import Login from '../../presentation/screens/auth/Login';
import Signup from '../../presentation/screens/auth/Signup';
import PublicLayout from '../../presentation/layouts/PublicLayout';
import AuthLayout from '../../presentation/layouts/AuthLayout';

// 1. Establish the absolute root route (renders an Outlet container)
const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

// 2. Establish pathless layout routes
const publicLayout = createRoute({
  getParentRoute: () => rootRoute,
  id: '_public', // Prefix with underscore for pathless layout
  component: PublicLayout,
});

const authLayout = createRoute({
  getParentRoute: () => rootRoute,
  id: '_auth', // Prefix with underscore for pathless layout
  component: AuthLayout,
});

// 3. Configure concrete screens routes nested under their layouts
const indexRoute = createRoute({
  getParentRoute: () => publicLayout,
  path: '/',
  component: Homescreen,
});

const loginRoute = createRoute({
  getParentRoute: () => authLayout,
  path: '/login',
  component: Login,
});

const signupRoute = createRoute({
  getParentRoute: () => authLayout,
  path: '/signup',
  component: Signup,
});

// 4. Assemble the unified route tree
const routeTree = rootRoute.addChildren([
  publicLayout.addChildren([
    indexRoute,
  ]),
  authLayout.addChildren([
    loginRoute,
    signupRoute,
  ]),
]);

// 5. Create the unified router
export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
