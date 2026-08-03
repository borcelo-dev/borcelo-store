"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/card";
import { Layers, ChartBar, AlertTriangle, X } from "lucide-react";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { dismissConflict } from "@/lib/data-access/pendingSales";
import type { CartItem } from "@/lib/schemas/sale";

type ConflictSale = {
  id: string;
  cart: CartItem[];
  cashierName: string;
  conflictReason: string;
  createdAt: { toDate(): Date };
};

const links = [
  {
    href: "/more/categories",
    label: "Categories",
    description: "Manage product categories",
    icon: Layers,
  },
  {
    href: "/more/reports",
    label: "Reports",
    description: "Sales and stock reports",
    icon: ChartBar,
  },
];

export default function MorePage() {
  const [conflicts, setConflicts] = useState<ConflictSale[]>([]);

  const handleDismiss = async (id: string) => {
    try {
      await dismissConflict(id);
      setConflicts((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error("Failed to dismiss conflict:", err);
    }
  };

  useEffect(() => {
    async function load() {
      const q = query(
        collection(db, "pendingSales"),
        where("status", "==", "conflict"),
        orderBy("createdAt", "desc"),
      );
      const snap = await getDocs(q);
      setConflicts(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            cart: data.cart,
            cashierName: data.cashierName,
            conflictReason: data.conflictReason,
            createdAt: data.createdAt,
          };
        }),
      );
    }
    load();
  }, []);

  return (
    <div className="py-6 space-y-4">
      <h1 className="font-heading font-bold text-2xl">More</h1>

      {conflicts.length > 0 && (
        <Card className="border-danger/30">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={20} className="text-danger" />
            <h2 className="font-heading font-bold text-lg text-danger">
              <span className="tabular-nums">{conflicts.length}</span> sale{conflicts.length !== 1 ? "s" : ""} need review
            </h2>
          </div>
          <div className="space-y-2">
            {conflicts.map((c) => (
              <div key={c.id} className="border border-border rounded-2px p-3 bg-surface-muted/50">
                <div className="flex items-start justify-between mb-1">
                  <p className="text-sm text-ink-muted">
                    {c.cashierName} · {c.createdAt.toDate().toLocaleString()}
                  </p>
                  <button
                    onClick={() => handleDismiss(c.id)}
                    className="text-ink-muted hover:text-danger transition-colors p-1 -m-1"
                    aria-label="Dismiss conflict"
                  >
                    <X size={16} />
                  </button>
                </div>
                <p className="font-semibold text-danger text-sm mb-2">{c.conflictReason}</p>
                <div className="text-sm text-ink-muted">
                  {c.cart.map((item) => (
                    <span key={item.productId} className="tabular-nums mr-3">
                      {item.name} x{item.qty} @ P{item.unitPrice.toFixed(2)}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-ink-muted mt-1 font-mono">Sale ID: {c.id}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href}>
              <Card className="flex items-center gap-4 hover:bg-surface-muted transition-colors">
                <Icon size={24} className="text-purple" />
                <div>
                  <p className="font-semibold">{link.label}</p>
                  <p className="text-ink-muted text-sm">{link.description}</p>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
