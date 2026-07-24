"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { onSalesChange } from "@/lib/data-access/sales";
import { onProductsChange } from "@/lib/data-access/products";
import { getSaleStockLogs } from "@/lib/data-access/stockLogs";
import Card from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, DollarSign } from "lucide-react";
import type { Sale } from "@/lib/schemas/sale";
import type { Product } from "@/lib/schemas/product";
import type { StockLog } from "@/lib/schemas/stockLog";

export default function ReportsPage() {
  const router = useRouter();
  const [sales, setSales] = useState<(Sale & { id: string })[]>([]);
  const [products, setProducts] = useState<(Product & { id: string })[]>([]);
  const [stockLogs, setStockLogs] = useState<(StockLog & { id: string })[]>([]);

  useEffect(() => {
    const unsubSales = onSalesChange(setSales);
    const unsubProducts = onProductsChange(setProducts);
    return () => { unsubSales(); unsubProducts(); };
  }, []);

  useEffect(() => {
    getSaleStockLogs().then(setStockLogs);
  }, []);

  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
  const totalItemsSold = sales.reduce((sum, s) => sum + s.items.reduce((a, i) => a + i.qty, 0), 0);

  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const sale of sales) {
      for (const item of sale.items) {
        const existing = map.get(item.productId) || { name: item.name, qty: 0, revenue: 0 };
        existing.qty += item.qty;
        existing.revenue += item.lineTotal;
        map.set(item.productId, existing);
      }
    }
    return [...map.entries()]
      .sort(([, a], [, b]) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [sales]);

  const productSales = new Map<string, { totalQty: number; count: number }>();
  for (const log of stockLogs) {
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
    .sort((a, b) => a.daysLeft - b.daysLeft);

  return (
    <div className="py-6 space-y-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-ink-muted hover:text-ink transition-colors"
      >
        <ArrowLeft size={20} />
        <span className="text-sm font-semibold">Back</span>
      </button>

      <h1 className="font-heading font-bold text-2xl">Reports</h1>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center gap-2 mb-1">
            <DollarSign size={20} className="text-success" />
            <span className="text-ink-muted text-sm">Total Revenue</span>
          </div>
          <p className="tabular-nums text-2xl font-semibold">
            &#x20B1;{totalRevenue.toFixed(2)}
          </p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={20} className="text-purple" />
            <span className="text-ink-muted text-sm">Items Sold</span>
          </div>
          <p className="tabular-nums text-2xl font-semibold">{totalItemsSold}</p>
        </Card>
      </div>

      {topProducts.length > 0 && (
        <section>
          <h2 className="font-heading font-bold text-lg mb-3">Top Products</h2>
          <div className="space-y-2">
            {topProducts.map(([id, data], i) => (
              <Card key={id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-2px bg-purple-tint text-purple text-sm font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-semibold">{data.name}</p>
                    <p className="text-ink-muted text-sm">{data.qty} sold</p>
                  </div>
                </div>
                <p className="tabular-nums font-semibold">
                  &#x20B1;{data.revenue.toFixed(2)}
                </p>
              </Card>
            ))}
          </div>
        </section>
      )}

      {restockSuggestions.length > 0 && (
        <section>
          <h2 className="font-heading font-bold text-lg mb-3">Restock Forecast</h2>
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
    </div>
  );
}
