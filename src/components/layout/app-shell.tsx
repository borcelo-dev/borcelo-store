"use client";

import type { ReactNode } from "react";
import TopBar from "./top-bar";
import BottomNav from "./bottom-nav";
import Sidebar from "./sidebar";
import InstallBanner from "./install-banner";
import ServiceWorkerRegistration from "./sw-register";
import SyncIndicator from "@/components/ui/sync-indicator";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col bg-bg">
      <ServiceWorkerRegistration />
      <TopBar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 px-4 pb-[calc(64px+env(safe-area-inset-bottom,0px))] md:pb-4 max-w-4xl mx-auto w-full">
          {children}
        </main>
      </div>
      <SyncIndicator />
      <InstallBanner />
      <BottomNav />
    </div>
  );
}
