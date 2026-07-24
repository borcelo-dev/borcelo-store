"use client";

import { useState, useEffect } from "react";

export default function SyncIndicator() {
  const [online, setOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div className="fixed bottom-[calc(64px+env(safe-area-inset-bottom,0px))] left-0 right-0 z-40">
      <div className="mx-auto max-w-fit bg-danger text-white text-sm font-semibold px-4 py-2 rounded-2px shadow-lg">
        Saving offline — will sync when reconnected
      </div>
    </div>
  );
}
