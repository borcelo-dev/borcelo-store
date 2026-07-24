"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSale } from "@/lib/data-access/sales";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import { ArrowLeft, ReceiptText } from "lucide-react";
import type { Sale } from "@/lib/schemas/sale";

export default function SaleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [sale, setSale] = useState<(Sale & { id: string }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSale(id).then((s) => {
      setSale(s);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return <div className="py-12 text-center text-ink-muted">Loading...</div>;
  }

  if (!sale) {
    return (
      <div className="py-12 text-center">
        <p className="text-ink-muted">Sale not found.</p>
        <Button variant="secondary" onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  const date = sale.createdAt
    ? new Date((sale.createdAt as unknown as { seconds: number }).seconds * 1000)
    : new Date();

  return (
    <div className="py-6 space-y-6 max-w-md mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-ink-muted hover:text-ink transition-colors"
      >
        <ArrowLeft size={20} />
        <span className="text-sm font-semibold">Back to History</span>
      </button>

      <Card>
        <div className="text-center mb-6">
          <ReceiptText size={40} className="text-purple mx-auto mb-2" />
          <h1 className="font-heading font-bold text-xl">Borcello Store</h1>
          <p className="text-ink-muted text-sm">Sales Receipt</p>
        </div>

        <div className="border-b border-border pb-3 mb-3">
          <div className="flex justify-between text-sm">
            <span className="text-ink-muted">Date</span>
            <span className="tabular-nums">{date.toLocaleString("en-PH", {
              dateStyle: "medium",
              timeStyle: "short",
            })}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-ink-muted">Cashier</span>
            <span>{sale.cashierName}</span>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          {sale.items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <div>
                <span className="font-semibold">{item.name}</span>
                <span className="text-ink-muted ml-1">x{item.qty}</span>
              </div>
              <span className="tabular-nums">&#x20B1;{item.lineTotal.toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-3 flex justify-between">
          <span className="font-heading font-bold text-lg">Total</span>
          <span className="tabular-nums font-bold text-2xl">
            &#x20B1;{sale.total.toFixed(2)}
          </span>
        </div>
      </Card>
    </div>
  );
}
