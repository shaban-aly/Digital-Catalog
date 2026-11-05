import { createRouter as createTanStackRouter } from '@tanstack/react-router';
import { Route as rootRoute } from './routes/__root';
import { Route as indexRoute } from './routes/index';
import { Route as publicCatalogRoute } from './routes/_public/c/$catalogSlug';
import { Route as loginRoute } from './routes/auth/login';
import { Route as registerRoute } from './routes/auth/register';
import { Route as dashboardIndexRoute } from './routes/_admin/dashboard/index';
import { Route as dashboardProductsRoute } from './routes/_admin/dashboard/products';

const routeTree = rootRoute.addChildren([
  indexRoute,
  publicCatalogRoute,
  loginRoute,
  registerRoute,
  dashboardIndexRoute,
  dashboardProductsRoute,
]);

export function createRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
  });

  return router;
}

export const getRouter = () => createRouter();

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
