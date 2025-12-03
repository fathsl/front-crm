import type { LucideIcon } from "lucide-react";

export interface StatCard {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  bgColor: string;
  iconColor: string;
  requiredPermission?: string;
}

export interface Activity {
  id: string;
  title: string;
  time: string;
  icon: LucideIcon;
  bgColor: string;
  iconColor: string;
}
