"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Settings, Ellipsis, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

export default function TopBar() {
  const { userDoc, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const initials = userDoc?.displayName
    ? userDoc.displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 left-0 right-0 z-20 bg-surface border-b border-border px-4">
      <div className="flex items-center justify-between h-14 max-w-4xl mx-auto">
        <img
          src="/lockup-on-light.png"
          alt="Borcello Store"
          className="h-8 w-auto"
        />

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 h-10 px-2 rounded-2px hover:bg-surface-muted transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-purple text-white flex items-center justify-center font-semibold text-sm">
              {initials}
            </div>
            <ChevronDown size={16} className={`text-ink-muted transition-transform ${open ? "rotate-180" : ""}`} />
          </button>

          {open && (
            <div
              className="absolute right-0 top-full mt-2 w-52 bg-surface rounded-2px border border-border py-1"
              style={{ boxShadow: "0 2px 8px rgba(34,25,52,0.12)" }}
            >
              <button
                onClick={() => { router.push("/profile"); setOpen(false); }}
                className="flex items-center gap-3 w-full h-12 px-4 text-ink text-[17px] hover:bg-surface-muted transition-colors"
              >
                <User size={20} />
                Profile
              </button>
              <button
                onClick={() => { router.push("/settings"); setOpen(false); }}
                className="flex items-center gap-3 w-full h-12 px-4 text-ink text-[17px] hover:bg-surface-muted transition-colors"
              >
                <Settings size={20} />
                Settings
              </button>
              <div className="my-1 border-t border-border" />
              <button
                onClick={() => { router.push("/more"); setOpen(false); }}
                className="flex items-center gap-3 w-full h-12 px-4 text-ink text-[17px] hover:bg-surface-muted transition-colors"
              >
                <Ellipsis size={20} />
                More
              </button>
              <div className="my-1 border-t border-border" />
              <button
                onClick={() => { setOpen(false); handleLogout(); }}
                className="flex items-center gap-3 w-full h-12 px-4 text-danger text-[17px] hover:bg-surface-muted transition-colors font-semibold"
              >
                <LogOut size={20} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
