"use client";

import { useAuth } from "@/contexts/auth-context";
import Card from "@/components/ui/card";
import { User } from "lucide-react";

export default function ProfilePage() {
  const { user, userDoc } = useAuth();

  return (
    <div className="py-6 space-y-4">
      <h1 className="font-heading font-bold text-2xl">Profile</h1>

      <Card>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-purple text-white flex items-center justify-center">
            <User size={32} />
          </div>
          <div>
            <p className="font-heading font-bold text-xl">{userDoc?.displayName || "User"}</p>
            <p className="text-ink-muted">{user?.email}</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-border space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-ink-muted">Role</span>
            <span className="font-semibold capitalize">{userDoc?.role || "—"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-ink-muted">User ID</span>
            <span className="tabular-nums text-xs text-ink-muted truncate max-w-[200px]">
              {user?.uid || "—"}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
