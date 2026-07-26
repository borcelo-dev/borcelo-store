"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "./nav-items";

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 bg-surface border-t border-border flex justify-around items-end md:hidden"
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        boxShadow: "0 2px 8px rgba(34,25,52,0.12)",
      }}
    >
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center gap-1 min-h-[64px] min-w-[64px] px-2 text-sm font-semibold transition-colors ${
              isActive ? "text-purple" : "text-ink-muted"
            }`}
          >
            <div className={`p-1.5 rounded-2px ${isActive ? "bg-purple-tint" : ""}`}>
              <Icon size={24} strokeWidth={2} />
            </div>
            <span className="text-xs leading-none">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
