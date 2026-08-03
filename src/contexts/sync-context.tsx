"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react";
import { onPendingSalesChange, processPendingSales, flushLocalQueue } from "@/lib/data-access/pendingSales";
import { offlineQueue } from "@/lib/offline-queue";

type SyncState = {
  pendingCount: number;
  conflictCount: number;
  localPending: number;
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
  const [localPending, setLocalPending] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const syncingRef = useRef(false);

  // Refresh the local IndexedDB queue count in state.
  const refreshLocalCount = useCallback(async () => {
    const count = await offlineQueue.count();
    setLocalPending(count);
  }, []);

  const runProcessor = useCallback(async () => {
    if (syncingRef.current || !online) return;
    syncingRef.current = true;
    setSyncing(true);
    try {
      // 1. Flush any locally queued offline sales to Firestore first.
      await flushLocalQueue();
      await refreshLocalCount();

      // 2. Then run the existing Firestore-side processor.
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
  }, [online, refreshLocalCount]);

  // Subscribe to Firestore pending sales changes.
  useEffect(() => {
    const unsub = onPendingSalesChange((pending, conflicts) => {
      setPendingCount(pending);
      setConflictCount(conflicts);
    });
    return unsub;
  }, []);

  // Seed local count on mount.
  useEffect(() => {
    refreshLocalCount();
  }, [refreshLocalCount]);

  // Handle online/offline transitions.
  useEffect(() => {
    const goOnline = () => {
      setOnline(true);
      runProcessor();
    };
    const goOffline = () => {
      setOnline(false);
      refreshLocalCount(); // Ensure count is fresh after going offline
    };
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, [runProcessor, refreshLocalCount]);

  // Run processor once on mount.
  useEffect(() => {
    runProcessor();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Poll every 30s while online.
  useEffect(() => {
    if (!online) return;
    const interval = setInterval(runProcessor, 30_000);
    return () => clearInterval(interval);
  }, [online, runProcessor]);

  return (
    <SyncContext.Provider value={{ pendingCount, conflictCount, localPending, syncing, online, runProcessor }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error("useSync must be used within SyncProvider");
  return ctx;
}
