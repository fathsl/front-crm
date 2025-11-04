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
    route("clients", "routes/clients.tsx"),
    route("meetings", "routes/meetings.tsx"),
    route("chats", "routes/chats.tsx"),
    route("reports/:id", "routes/reports/[id].tsx"),
    route("clients/:id", "routes/clients/[id].tsx"),
    route("profile", "routes/profile.tsx"),
    route("media", "routes/media.tsx"),
    route("progress", "routes/progress.tsx"),
    route("progress/:id", "routes/progress/[id].tsx"),
    route("discussion-reports/:id", "routes/discussionReport/[id].tsx"),
    route("offers", "routes/offers.tsx"),
    route("offers/new", "routes/offers/new.tsx"),
    route("categories", "routes/categories.tsx"),
    route("chats/:discussionId", "routes/chats/[discussionId].tsx"),
  ]),
] satisfies RouteConfig;
