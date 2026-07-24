"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/button";
import { Download } from "lucide-react";

export default function InstallBanner() {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [dismissed, setDismissed] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(display-mode: standalone)").matches : false
  );

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    const prompt = deferredPrompt as unknown as { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice.outcome === "accepted") {
      setShow(false);
      setDismissed(true);
    }
    setDeferredPrompt(null);
  };

  if (!show || dismissed) return null;

  return (
    <div className="fixed bottom-[calc(64px+env(safe-area-inset-bottom,0px)+8px)] left-4 right-4 z-40">
      <div className="bg-surface rounded-2px border border-border p-4 shadow-lg max-w-lg mx-auto flex items-center gap-3">
        <div className="flex-1">
          <p className="font-semibold text-ink">Install Borcello Store</p>
          <p className="text-ink-muted text-sm">
            Add to your home screen for quick access
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" className="h-10 text-sm" onClick={() => setDismissed(true)}>
            Dismiss
          </Button>
          <Button className="h-10 text-sm" onClick={handleInstall}>
            <Download size={16} className="mr-1" />
            Install
          </Button>
        </div>
      </div>
    </div>
  );
}
