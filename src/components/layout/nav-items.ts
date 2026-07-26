import { LayoutDashboard, Package, ShoppingCart, History } from "lucide-react";

export const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Products", icon: Package },
  { href: "/pos", label: "Sell", icon: ShoppingCart },
  { href: "/sales", label: "History", icon: History },
];
