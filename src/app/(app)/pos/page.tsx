"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { onProductsChange, getProductsByBarcode } from "@/lib/data-access/products";
import { stageSale } from "@/lib/data-access/pendingSales";
import { useAuth } from "@/contexts/auth-context";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import Modal from "@/components/ui/modal";
import { Search, Barcode, Trash2, ShoppingCart, CheckCircle } from "lucide-react";
import type { Product } from "@/lib/schemas/product";
import type { CartItem } from "@/lib/schemas/sale";

export default function PosPage() {
  const { user, userDoc } = useAuth();
  const [products, setProducts] = useState<(Product & { id: string })[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [barcodeScanning, setBarcodeScanning] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [successTotal, setSuccessTotal] = useState(0);
  const scannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = onProductsChange(setProducts);
    return unsub;
  }, []);

  const addToCart = useCallback((product: Product & { id: string }) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        if (existing.qty >= product.quantity) {
          setCheckoutError(`No more stock available for "${product.name}".`);
          return prev;
        }
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, qty: item.qty + 1, lineTotal: (item.qty + 1) * item.unitPrice }
            : item
        );
      }
      if (product.quantity <= 0) {
        setCheckoutError(`"${product.name}" is out of stock.`);
        return prev;
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          qty: 1,
          unitPrice: product.unitPrice,
          lineTotal: product.unitPrice,
        },
      ];
    });
    setCheckoutError("");
  }, []);

  const handleBarcodeScan = useCallback(async (barcode: string) => {
    const result = await getProductsByBarcode(barcode);
    if (result) {
      addToCart(result);
      setSearch("");
    } else {
      setSearch(barcode);
    }
  }, [addToCart]);

  useEffect(() => {
    if (!barcodeScanning) return;

    let scanner: import("html5-qrcode").Html5Qrcode | null = null;

    const startScanner = async () => {
      const { Html5Qrcode } = await import("html5-qrcode");
      scanner = new Html5Qrcode("barcode-scanner");
      try {
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 150 },
          },
          (decodedText: string) => {
            handleBarcodeScan(decodedText);
            scanner?.stop();
            setBarcodeScanning(false);
          },
          () => {}
        );
      } catch {
        setBarcodeScanning(false);
      }
    };

    startScanner();

    return () => {
      scanner?.stop().catch(() => {});
    };
  }, [barcodeScanning, handleBarcodeScan]);

  const updateQty = (productId: string, delta: number) => {
    const product = products.find((p) => p.id === productId);
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId !== productId) return item;
          const newQty = item.qty + delta;
          if (newQty <= 0) return null;
          if (product && newQty > product.quantity) {
            setCheckoutError(`Only ${product.quantity} available for "${item.name}".`);
            return item;
          }
          return { ...item, qty: newQty, lineTotal: newQty * item.unitPrice };
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const removeItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const total = cart.reduce((sum, item) => sum + item.lineTotal, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (!user) {
      setCheckoutError("Not signed in. Please refresh and try again.");
      return;
    }
    // Fall back to Firebase Auth display name / email if Firestore user doc is unavailable
    const cashierName = userDoc?.displayName || user.displayName || user.email || "Cashier";

    setCheckingOut(true);
    setCheckoutError("");
    try {
      const saleTotal = cart.reduce((sum, item) => sum + item.lineTotal, 0);
      await stageSale(cart, user.uid, cashierName);
      setCart([]);
      setSuccessTotal(saleTotal);
      setCheckoutSuccess(true);
    } catch (err: unknown) {
      setCheckoutError(
        err instanceof Error ? err.message : "Checkout failed. Please try again."
      );
    } finally {
      setCheckingOut(false);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode && p.barcode.includes(search))
  );

  return (
    <div className="py-6 space-y-4">
      <h1 className="font-heading font-bold text-2xl">Point of Sale</h1>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products or scan barcode..."
            className="w-full h-12 pl-10 pr-3 rounded-2px border border-border bg-surface text-ink text-[17px] placeholder:text-ink-muted"
          />
        </div>
        <Button variant="secondary" onClick={() => setBarcodeScanning(true)}>
          <Barcode size={20} />
        </Button>
      </div>

      {barcodeScanning && (
        <Card className="overflow-hidden p-0">
          <div className="relative">
            <div id="barcode-scanner" ref={scannerRef} className="w-full" style={{ minHeight: "300px" }} />
            <Button
              variant="ghost"
              className="absolute top-2 right-2"
              onClick={() => { setBarcodeScanning(false); }}
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {search && !barcodeScanning && (
        <div className="space-y-2">
          {filteredProducts.slice(0, 8).map((p) => (
            <button
              key={p.id}
              onClick={() => addToCart(p)}
              className="w-full text-left"
            >
              <Card className="flex items-center justify-between hover:bg-surface-muted transition-colors">
                <div>
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-ink-muted text-sm">
                    {p.categoryName} | &#x20B1;{p.unitPrice.toFixed(2)}
                  </p>
                </div>
                <Badge variant={p.quantity <= p.bufferQuantity ? "danger" : p.quantity > 0 ? "success" : "danger"}>
                  {p.quantity > 0 ? `${p.quantity} in stock` : "Out of stock"}
                </Badge>
              </Card>
            </button>
          ))}
        </div>
      )}

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <ShoppingCart size={20} className="text-purple" />
          <h2 className="font-heading font-bold text-lg">Cart</h2>
          <span className="tabular-nums text-ink-muted text-sm ml-auto">
            {cart.length} item{cart.length !== 1 ? "s" : ""}
          </span>
        </div>

        {cart.length === 0 ? (
          <p className="text-ink-muted text-center py-4">Cart is empty.</p>
        ) : (
          <div className="space-y-2">
            {cart.map((item) => (
              <div
                key={item.productId}
                className="flex items-center justify-between gap-2 py-2 border-b border-border last:border-b-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{item.name}</p>
                  <p className="tabular-nums text-ink-muted text-sm">
                    &#x20B1;{item.unitPrice.toFixed(2)} x {item.qty}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateQty(item.productId, -1)}
                    aria-label={`Decrease quantity of ${item.name}`}
                    className="w-12 h-12 rounded-2px border border-border flex items-center justify-center text-ink hover:bg-surface-muted shrink-0"
                  >
                    -
                  </button>
                  <span className="tabular-nums w-8 text-center font-semibold">
                    {item.qty}
                  </span>
                  <button
                    onClick={() => updateQty(item.productId, 1)}
                    aria-label={`Increase quantity of ${item.name}`}
                    className="w-12 h-12 rounded-2px border border-border flex items-center justify-center text-ink hover:bg-surface-muted shrink-0"
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeItem(item.productId)}
                    aria-label={`Remove ${item.name} from cart`}
                    className="w-12 h-12 rounded-2px flex items-center justify-center text-danger hover:bg-surface-muted shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <p className="tabular-nums font-semibold w-20 text-right shrink-0">
                  &#x20B1;{item.lineTotal.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <span className="font-heading font-bold text-lg">Total</span>
          <span className="tabular-nums font-bold text-2xl text-ink">
            &#x20B1;{total.toFixed(2)}
          </span>
        </div>
      </Card>

      {checkoutError && (
        <div className="bg-[#FCE4E4] text-danger text-sm font-semibold px-4 py-3 rounded-2px">
          {checkoutError}
        </div>
      )}

      <Button
        className="w-full"
        disabled={cart.length === 0 || checkingOut}
        onClick={handleCheckout}
      >
        {checkingOut ? (
          "Processing..."
        ) : (
          <>
            <ShoppingCart size={20} className="mr-1" />
            Checkout (&#x20B1;{total.toFixed(2)})
          </>
        )}
      </Button>

      <Modal
        open={checkoutSuccess}
        onClose={() => setCheckoutSuccess(false)}
      >
        <div className="flex flex-col items-center text-center gap-4 py-2">
          <div className="w-16 h-16 rounded-full bg-[#E6F9F0] flex items-center justify-center">
            <CheckCircle size={36} className="text-[#22c55e]" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-2xl text-ink mb-1">Sale Successful!</h2>
            <p className="text-ink-muted text-sm">The order has been staged and will be processed shortly.</p>
          </div>
          <div className="w-full bg-surface-muted rounded-2px px-6 py-4">
            <p className="text-ink-muted text-sm mb-1">Total Collected</p>
            <p className="font-heading font-bold text-3xl tabular-nums text-ink">&#x20B1;{successTotal.toFixed(2)}</p>
          </div>
          <Button className="w-full" onClick={() => setCheckoutSuccess(false)}>
            Done
          </Button>
        </div>
      </Modal>
    </div>
  );
}
