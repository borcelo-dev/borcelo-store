"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { onSalesChange } from "@/lib/data-access/sales";
import Card from "@/components/ui/card";
import type { Sale } from "@/lib/schemas/sale";
import { ReceiptText } from "lucide-react";

export default function SalesPage() {
  const [sales, setSales] = useState<(Sale & { id: string })[]>([]);

  useEffect(() => {
    const unsub = onSalesChange(setSales);
    return unsub;
  }, []);

  return (
    <div className="py-6 space-y-4">
      <h1 className="font-heading font-bold text-2xl">Sales History</h1>

      {sales.length === 0 ? (
        <Card>
          <p className="text-ink-muted text-center py-8">No sales recorded yet.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {sales.map((sale) => (
            <Link key={sale.id} href={`/sales/${sale.id}`}>
              <Card className="hover:bg-surface-muted transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ReceiptText size={20} className="text-ink-muted" />
                    <div>
                      <p className="font-semibold">
                        {sale.items.length} item{sale.items.length !== 1 ? "s" : ""}
                      </p>
                      <p className="text-ink-muted text-sm">
                        {sale.cashierName}
                        {" · "}
                        {sale.createdAt
                          ? new Date(
                              (sale.createdAt as unknown as { seconds: number }).seconds * 1000
                            ).toLocaleString("en-PH", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })
                          : ""}
                      </p>
                    </div>
                  </div>
                  <div className="tabular-nums font-bold text-lg">
                    &#x20B1;{sale.total.toFixed(2)}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
