"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { onProductsChange } from "@/lib/data-access/products";
import { getSaleStockLogs } from "@/lib/data-access/stockLogs";
import Card from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import type { Product } from "@/lib/schemas/product";
import type { StockLog } from "@/lib/schemas/stockLog";
import { AlertTriangle, Package } from "lucide-react";

export default function DashboardPage() {
  const { userDoc } = useAuth();
  const [products, setProducts] = useState<(Product & { id: string })[]>([]);
  const [saleLogs, setSaleLogs] = useState<(StockLog & { id: string })[]>([]);

  useEffect(() => {
    const unsub = onProductsChange(setProducts);
    return unsub;
  }, []);

  useEffect(() => {
    getSaleStockLogs().then(setSaleLogs);
  }, []);

  const lowStockProducts = products.filter((p) => p.quantity <= p.bufferQuantity);
  const totalProducts = products.length;

  const productSales = new Map<string, { totalQty: number; count: number }>();
  for (const log of saleLogs) {
    const existing = productSales.get(log.productId) || { totalQty: 0, count: 0 };
    existing.totalQty += Math.abs(log.delta);
    existing.count += 1;
    productSales.set(log.productId, existing);
  }

  const restockSuggestions = products
    .filter((p) => p.quantity > 0)
    .map((p) => {
      const stats = productSales.get(p.id);
      if (!stats) return null;
      const avgDailySales = stats.totalQty / Math.max(stats.count, 1);
      const daysLeft = p.quantity / Math.max(avgDailySales, 0.1);
      return { product: p, daysLeft, avgDailySales };
    })
    .filter((s): s is NonNullable<typeof s> => s !== null)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 10);

  const today = new Date().toLocaleDateString("en-PH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="py-6 space-y-6">
      <div>
        <p className="text-ink-muted text-sm">{today}</p>
        <h1 className="font-heading font-bold text-2xl">
          Welcome, {userDoc?.displayName || "Shopkeeper"}
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center gap-2 mb-1">
            <Package size={20} className="text-purple" />
            <span className="text-ink-muted text-sm">Products</span>
          </div>
          <p className="tabular-nums text-2xl font-semibold">{totalProducts}</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={20} className="text-danger" />
            <span className="text-ink-muted text-sm">Low Stock</span>
          </div>
          <p className="tabular-nums text-2xl font-semibold text-danger">{lowStockProducts.length}</p>
        </Card>
      </div>

      {lowStockProducts.length > 0 && (
        <section>
          <h2 className="font-heading font-bold text-lg mb-3">Low Stock Alerts</h2>
          <div className="space-y-2">
            {lowStockProducts.map((p) => (
              <Card key={p.id} className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-ink-muted text-sm">{p.categoryName}</p>
                </div>
                <div className="text-right">
                  <p className="tabular-nums text-danger font-semibold">{p.quantity}</p>
                  <p className="text-ink-muted text-xs">buffer: {p.bufferQuantity}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {restockSuggestions.length > 0 && (
        <section>
          <h2 className="font-heading font-bold text-lg mb-3">Smart Restock Assistant</h2>
          <div className="space-y-2">
            {restockSuggestions.map((s) => (
              <Card key={s.product.id} className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{s.product.name}</p>
                  <p className="text-ink-muted text-sm">
                    Avg {s.avgDailySales.toFixed(1)} sold/day
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant={s.daysLeft < 3 ? "danger" : s.daysLeft < 7 ? "default" : "success"}>
                    ~{Math.round(s.daysLeft)} days left
                  </Badge>
                  <p className="tabular-nums text-ink-muted text-xs mt-1">
                    {s.product.quantity} in stock
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {lowStockProducts.length === 0 && restockSuggestions.length === 0 && (
        <Card>
          <p className="text-ink-muted text-center py-8">
            All products are well-stocked. Add your first product to get started.
          </p>
        </Card>
      )}
    </div>
  );
}
