"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "./nav-items";

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col flex-shrink-0 bg-surface border-r border-border pt-4" style={{ width: 220 }}>
      <nav className="flex flex-col gap-1 px-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 h-12 px-3 rounded-2px text-[17px] font-semibold transition-colors ${
                isActive ? "text-purple bg-purple-tint" : "text-ink-muted hover:bg-surface-muted"
              }`}
            >
              <Icon size={24} strokeWidth={2} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
