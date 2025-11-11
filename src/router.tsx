import {
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { AppShell } from "./AppShell";
import { HomeScreen } from "./screens/HomeScreen";
import { SensesScreen } from "./screens/SensesScreen";
import { DraftScreen } from "./screens/DraftScreen";
import { ExportScreen } from "./screens/ExportScreen";

const rootRoute = createRootRoute({
  component: AppShell,
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomeScreen,
});

const sensesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/senses",
  component: SensesScreen,
});

const draftRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/draft",
  component: DraftScreen,
});

const exportRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/export",
  component: ExportScreen,
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  sensesRoute,
  draftRoute,
  exportRoute,
]);

export const router = createRouter({
  routeTree,
});
