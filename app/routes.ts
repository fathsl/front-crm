import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  // Login page without layout
  route("login", "routes/login.tsx"),
  
  // Main layout for all other pages
  layout("components/Layout.tsx", [
    index("routes/home.tsx"),
    route("dashboard", "routes/dashboard.tsx"),
    route("reporting", "routes/reporting.tsx"),
    route("analytics", "routes/analytics.tsx"),
    route("users", "routes/users.tsx"),
    route("reports", "routes/reports.tsx"),
    route("projects", "routes/projects.tsx"),
    route("projects.$idProject", "routes/projects.$idProject.tsx"),
    route("clients", "routes/clients.tsx"),
    route("meetings", "routes/meetings.tsx"),
    route("chats", "routes/chats.tsx"),
  ]),
] satisfies RouteConfig;
