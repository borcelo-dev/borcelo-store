"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export default function ElevateAdminPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState("Loading...");

  useEffect(() => {
    if (!user) {
      setStatus("Not signed in.");
      return;
    }

    (async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);

        if (!snap.exists()) {
          setStatus("User document not found in Firestore.");
          return;
        }

        const current = snap.data();
        if (current.role === "super_admin") {
          setStatus("Already super_admin. No action needed.");
          return;
        }

        await setDoc(userRef, { role: "super_admin" }, { merge: true });
        setStatus("Done! Role elevated to super_admin. You can close this page.");
      } catch (err: unknown) {
        setStatus(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    })();
  }, [user]);

  return (
    <div className="min-h-dvh flex items-center justify-center bg-bg">
      <div className="text-center">
        <h1 className="font-heading font-bold text-2xl mb-4">Elevate to Super Admin</h1>
        <p className="text-ink-muted">{status}</p>
      </div>
    </div>
  );
}
