"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getProduct, addStock } from "@/lib/data-access/products";
import { onStockLogsChange } from "@/lib/data-access/stockLogs";
import { useAuth } from "@/contexts/auth-context";
import Card from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { ArrowLeft, Package, Plus, History } from "lucide-react";
import type { Product } from "@/lib/schemas/product";
import type { StockLog } from "@/lib/schemas/stockLog";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [product, setProduct] = useState<(Product & { id: string }) | null>(null);
  const [logs, setLogs] = useState<(StockLog & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDelta, setAddDelta] = useState("");
  const [addNote, setAddNote] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getProduct(id).then((p) => {
      setProduct(p);
      setLoading(false);
    });
    const unsub = onStockLogsChange(id, setLogs);
    return unsub;
  }, [id]);

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    const delta = parseInt(addDelta);
    if (!delta || delta <= 0) {
      setError("Enter a valid quantity.");
      return;
    }
    if (!user) return;
    setError("");
    setAdding(true);
    try {
      await addStock(id, delta, user.uid, addNote || undefined);
      const updated = await getProduct(id);
      setProduct(updated);
      setAddDelta("");
      setAddNote("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add stock.");
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-ink-muted">Loading...</div>;
  }

  if (!product) {
    return (
      <div className="py-12 text-center">
        <p className="text-ink-muted">Product not found.</p>
        <Button variant="secondary" onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  const isLowStock = product.quantity <= product.bufferQuantity;

  return (
    <div className="py-6 space-y-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-ink-muted hover:text-ink transition-colors"
      >
        <ArrowLeft size={20} />
        <span className="text-sm font-semibold">Back to Products</span>
      </button>

      <div className="flex items-start gap-4">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-20 h-20 rounded-2px object-cover"
          />
        ) : (
          <div className="w-20 h-20 rounded-2px bg-purple-tint flex items-center justify-center">
            <Package size={32} className="text-purple" />
          </div>
        )}
        <div className="flex-1">
          <h1 className="font-heading font-bold text-2xl">{product.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge>{product.categoryName}</Badge>
            <Badge variant={isLowStock ? "danger" : "success"}>
              {product.quantity} in stock
              {isLowStock && " — LOW"}
            </Badge>
          </div>
          {product.barcode && (
            <p className="text-ink-muted text-sm mt-1">Barcode: {product.barcode}</p>
          )}
        </div>
        <div className="text-right">
          <p className="tabular-nums text-2xl font-bold text-ink">
            &#x20B1;{product.unitPrice.toFixed(2)}
          </p>
          <p className="text-ink-muted text-sm">per unit</p>
        </div>
      </div>

      <Card>
        <h2 className="font-heading font-bold text-lg mb-3">Add Stock</h2>
        <form onSubmit={handleAddStock} className="flex gap-2 items-end">
          <div className="flex-1">
            <Input
              id="addDelta"
              label="Quantity to add"
              type="number"
              min="1"
              value={addDelta}
              onChange={(e) => setAddDelta(e.target.value)}
              required
            />
          </div>
          <div className="flex-1">
            <Input
              id="addNote"
              label="Note (optional)"
              value={addNote}
              onChange={(e) => setAddNote(e.target.value)}
              placeholder="e.g. supplier delivery"
            />
          </div>
          <Button type="submit" disabled={adding}>
            <Plus size={20} className="mr-1" />
            {adding ? "Adding..." : "Add"}
          </Button>
        </form>
        {error && <p className="text-danger text-sm mt-2">{error}</p>}
      </Card>

      <section>
        <div className="flex items-center gap-2 mb-3">
          <History size={20} className="text-ink-muted" />
          <h2 className="font-heading font-bold text-lg">Stock Log</h2>
        </div>
        {logs.length === 0 ? (
          <Card>
            <p className="text-ink-muted text-center py-4">No stock activity yet.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {logs.map((log, i) => (
              <Card key={log.id || i} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-semibold">
                    {log.type === "restock" ? "+" : log.type === "sale" ? "-" : "~"}
                    {Math.abs(log.delta)} units
                  </p>
                  <p className="text-ink-muted">
                    {log.note || (log.type === "restock" ? "Stock added" : log.type === "sale" ? "Sale" : "Adjustment")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="tabular-nums font-semibold">
                    Result: {log.resultingQuantity}
                  </p>
                  {log.createdAt && (
                    <p className="text-ink-muted text-xs">
                      {new Date((log.createdAt as { seconds: number }).seconds * 1000).toLocaleDateString("en-PH")}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
