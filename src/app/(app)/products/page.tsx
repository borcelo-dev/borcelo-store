"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { onProductsChange, createProduct } from "@/lib/data-access/products";
import { onCategoriesChange } from "@/lib/data-access/categories";
import Card from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Modal from "@/components/ui/modal";
import ProductForm, { type ProductFormValues } from "@/components/product-form";
import { Plus, Search } from "lucide-react";
import type { Product } from "@/lib/schemas/product";

const emptyForm: ProductFormValues = {
  name: "",
  barcode: "",
  categoryName: "",
  unitPrice: "",
  quantity: "0",
  bufferQuantity: "5",
  imageUrl: null,
};

export default function ProductsPage() {
  const [products, setProducts] = useState<(Product & { id: string })[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const unsub = onProductsChange((p) => {
      setProducts(p);
      setProductsLoading(false);
    });
    const unsubCat = onCategoriesChange(setCategories);
    return () => { unsub(); unsubCat(); };
  }, []);

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode && p.barcode.includes(search));
    const matchCategory = !categoryFilter || p.categoryName === categoryFilter;
    return matchSearch && matchCategory;
  });

  const handleCreate = async (data: {
    name: string;
    barcode: string | null;
    categoryName: string;
    unitPrice: number;
    quantity: number;
    bufferQuantity: number;
    imageUrl: string | null;
  }) => {
    await createProduct(data);
    setShowForm(false);
  };

  return (
    <div className="py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-bold text-2xl">Products</h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus size={20} className="mr-1" />
          New Product
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or barcode..."
            className="w-full h-12 pl-10 pr-3 rounded-2px border border-border bg-surface text-ink text-[17px] placeholder:text-ink-muted"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-12 px-3 rounded-2px border border-border bg-surface text-ink text-[17px]"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.name}>{c.name}</option>
          ))}
        </select>
      </div>

      {productsLoading ? (
        <Card>
          <p className="text-ink-muted text-center py-8">Loading products...</p>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <p className="text-ink-muted text-center py-8">
            {search ? "No products match your search." : "No products yet. Add your first product."}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => (
            <Link key={p.id} href={`/products/${p.id}`}>
              <Card className="flex items-center justify-between hover:bg-surface-muted transition-colors">
                <div className="flex items-center gap-3">
                  {p.imageUrl ? (
                    <Image
                      src={p.imageUrl}
                      alt={p.name}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-2px object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2px bg-purple-tint flex items-center justify-center text-purple font-bold">
                      {p.name[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold">{p.name}</p>
                    <div className="flex items-center gap-2 text-sm text-ink-muted">
                      <span>{p.categoryName}</span>
                      {p.barcode && <span>| {p.barcode}</span>}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="tabular-nums font-semibold text-lg">
                    &#x20B1;{p.unitPrice.toFixed(2)}
                  </p>
                  <Badge variant={p.quantity <= p.bufferQuantity ? "danger" : "success"}>
                    {p.quantity} in stock
                  </Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="New Product">
        <ProductForm
          mode="create"
          categories={categories}
          initialValues={emptyForm}
          submitLabel="Create Product"
          submittingLabel="Creating..."
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
        />
      </Modal>
    </div>
  );
}
