"use client";

import Link from "next/link";
import { useSync } from "@/contexts/sync-context";
import { WifiOff, Loader, AlertTriangle, CloudOff } from "lucide-react";

const bannerBottom = "bottom-[calc(64px+env(safe-area-inset-bottom,0px))] md:bottom-4";

export default function SyncIndicator() {
  const { pendingCount, conflictCount, localPending, syncing, online } = useSync();

  const totalPending = localPending + pendingCount;

  if (conflictCount > 0) {
    return (
      <div className={`fixed left-0 right-0 z-40 pointer-events-none ${bannerBottom}`}>
        <Link href="/more" className="pointer-events-auto">
          <div className="mx-auto max-w-fit bg-danger text-white text-sm font-semibold px-4 py-2 rounded-2px shadow-lg flex items-center gap-2">
            <AlertTriangle size={16} />
            <span className="tabular-nums">{conflictCount}</span> sale{conflictCount !== 1 ? "s" : ""} need review
          </div>
        </Link>
      </div>
    );
  }

  if (!online && totalPending > 0) {
    return (
      <div className={`fixed left-0 right-0 z-40 pointer-events-none ${bannerBottom}`}>
        <div className="mx-auto max-w-fit bg-[#FBEECB] text-[#8A6614] text-sm font-semibold px-4 py-2 rounded-2px shadow-lg flex items-center gap-2">
          <CloudOff size={16} />
          <span>Saving offline — <span className="tabular-nums">{totalPending}</span> pending</span>
        </div>
      </div>
    );
  }

  if (!online && totalPending === 0) {
    return (
      <div className={`fixed left-0 right-0 z-40 pointer-events-none ${bannerBottom}`}>
        <div className="mx-auto max-w-fit bg-[#FCE4E4] text-danger text-xs font-semibold px-3 py-1 rounded-2px shadow-lg flex items-center gap-1.5">
          <WifiOff size={14} />
          Offline
        </div>
      </div>
    );
  }

  if (syncing || (online && totalPending > 0)) {
    return (
      <div className={`fixed left-0 right-0 z-40 pointer-events-none ${bannerBottom}`}>
        <div className="mx-auto max-w-fit bg-purple-tint text-purple text-sm font-semibold px-4 py-2 rounded-2px shadow-lg flex items-center gap-2">
          <Loader size={16} className="animate-spin" />
          Syncing...
        </div>
      </div>
    );
  }

  return null;
}
