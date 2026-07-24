"use client";

import { useAuth } from "@/contexts/auth-context";
import Card from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  const { userDoc } = useAuth();
  const isOwner = userDoc?.role === "owner";

  if (!isOwner) {
    return (
      <div className="py-6">
        <h1 className="font-heading font-bold text-2xl mb-4">Settings</h1>
        <Card>
          <p className="text-ink-muted text-center py-8">
            Only the store owner can access settings.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-6 space-y-4">
      <h1 className="font-heading font-bold text-2xl">Settings</h1>
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Settings size={20} className="text-purple" />
          <h2 className="font-heading font-bold text-lg">Business Settings</h2>
        </div>
        <p className="text-ink-muted text-sm">
          Business name, currency, and other store configuration will be available here
          in a future update.
        </p>
      </Card>
    </div>
  );
}
