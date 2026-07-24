"use client";

import Link from "next/link";
import Card from "@/components/ui/card";
import { Layers, ChartBar } from "lucide-react";

const links = [
  {
    href: "/more/categories",
    label: "Categories",
    description: "Manage product categories",
    icon: Layers,
  },
  {
    href: "/more/reports",
    label: "Reports",
    description: "Sales and stock reports",
    icon: ChartBar,
  },
];

export default function MorePage() {
  return (
    <div className="py-6 space-y-4">
      <h1 className="font-heading font-bold text-2xl">More</h1>

      <div className="space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href}>
              <Card className="flex items-center gap-4 hover:bg-surface-muted transition-colors">
                <Icon size={24} className="text-purple" />
                <div>
                  <p className="font-semibold">{link.label}</p>
                  <p className="text-ink-muted text-sm">{link.description}</p>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
