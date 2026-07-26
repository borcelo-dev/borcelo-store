"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react";
import { onPendingSalesChange, processPendingSales } from "@/lib/data-access/pendingSales";

type SyncState = {
  pendingCount: number;
  conflictCount: number;
  syncing: boolean;
  online: boolean;
};

type SyncContextType = SyncState & {
  runProcessor: () => Promise<void>;
};

const SyncContext = createContext<SyncContextType | null>(null);

export function SyncProvider({ children }: { children: ReactNode }) {
  const [pendingCount, setPendingCount] = useState(0);
  const [conflictCount, setConflictCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const syncingRef = useRef(false);

  const runProcessor = useCallback(async () => {
    if (syncingRef.current || !online) return;
    syncingRef.current = true;
    setSyncing(true);
    try {
      await processPendingSales((state) => {
        setPendingCount(state.pendingCount);
        setConflictCount(state.conflictCount);
        setSyncing(state.syncing);
        syncingRef.current = state.syncing;
      });
    } catch {
      // processor handles its own errors per-doc
    } finally {
      syncingRef.current = false;
      setSyncing(false);
    }
  }, [online]);

  useEffect(() => {
    const unsub = onPendingSalesChange((pending, conflicts) => {
      setPendingCount(pending);
      setConflictCount(conflicts);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const goOnline = () => {
      setOnline(true);
      runProcessor();
    };
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, [runProcessor]);

  useEffect(() => {
    runProcessor();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!online) return;
    const interval = setInterval(runProcessor, 30_000);
    return () => clearInterval(interval);
  }, [online, runProcessor]);

  return (
    <SyncContext.Provider value={{ pendingCount, conflictCount, syncing, online, runProcessor }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error("useSync must be used within SyncProvider");
  return ctx;
}
