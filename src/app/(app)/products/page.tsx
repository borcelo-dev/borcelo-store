"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { onProductsChange, createProduct, uploadProductImage } from "@/lib/data-access/products";
import { onCategoriesChange, createCategory } from "@/lib/data-access/categories";
import Card from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Modal from "@/components/ui/modal";
import { Plus, Search } from "lucide-react";
import type { Product } from "@/lib/schemas/product";

export default function ProductsPage() {
  const [products, setProducts] = useState<(Product & { id: string })[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const unsub = onProductsChange(setProducts);
    const unsubCat = onCategoriesChange(setCategories);
    return () => { unsub(); unsubCat(); };
  }, []);

  const [form, setForm] = useState({
    name: "",
    barcode: "",
    categoryName: "",
    unitPrice: "",
    quantity: "0",
    bufferQuantity: "5",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode && p.barcode.includes(search));
    const matchCategory = !categoryFilter || p.categoryName === categoryFilter;
    return matchSearch && matchCategory;
  });

  const resetForm = () => {
    setForm({ name: "", barcode: "", categoryName: "", unitPrice: "", quantity: "0", bufferQuantity: "5" });
    setImageFile(null);
    setFormError("");
  };

  const handleAddCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    try {
      await createCategory(name);
      setForm((f) => ({ ...f, categoryName: name }));
      setNewCategoryName("");
    } catch {
      setFormError("Failed to create category.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!form.name.trim() || !form.categoryName || !form.unitPrice) {
      setFormError("Name, category, and price are required.");
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl: string | null = null;
      if (imageFile) {
        imageUrl = await uploadProductImage(imageFile);
      }

      await createProduct({
        name: form.name.trim(),
        barcode: form.barcode.trim() || null,
        categoryName: form.categoryName,
        unitPrice: parseFloat(form.unitPrice),
        quantity: parseInt(form.quantity) || 0,
        bufferQuantity: parseInt(form.bufferQuantity) || 5,
        imageUrl,
      });

      resetForm();
      setShowForm(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create product.";
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
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

      {filtered.length === 0 ? (
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
                    <img
                      src={p.imageUrl}
                      alt={p.name}
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="name"
            label="Product Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />

          <Input
            id="barcode"
            label="Barcode (optional)"
            value={form.barcode}
            onChange={(e) => setForm({ ...form, barcode: e.target.value })}
          />

          <div>
            <label htmlFor="category" className="text-sm font-semibold text-ink">Category</label>
            <div className="flex gap-2 mt-1.5">
              <select
                id="category"
                value={form.categoryName}
                onChange={(e) => setForm({ ...form, categoryName: e.target.value })}
                className="flex-1 h-12 px-3 rounded-2px border border-border bg-surface text-ink text-[17px]"
                required
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="+ new category"
                className="flex-1 h-10 px-3 rounded-2px border border-border bg-surface text-ink text-sm placeholder:text-ink-muted"
              />
              <button
                type="button"
                onClick={handleAddCategory}
                className="h-10 px-3 rounded-2px bg-purple-tint text-purple text-sm font-semibold hover:bg-border transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          <Input
            id="unitPrice"
            label="Unit Price (₱)"
            type="number"
            step="0.01"
            min="0"
            value={form.unitPrice}
            onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              id="quantity"
              label="Initial Stock"
              type="number"
              min="0"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />
            <Input
              id="bufferQuantity"
              label="Buffer Quantity"
              type="number"
              min="1"
              value={form.bufferQuantity}
              onChange={(e) => setForm({ ...form, bufferQuantity: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-ink">Product Image (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="block mt-1.5 w-full text-sm text-ink-muted file:mr-4 file:py-2 file:px-4 file:rounded-2px file:border file:border-border file:bg-surface file:text-ink file:text-sm file:font-semibold hover:file:bg-surface-muted"
            />
          </div>

          {formError && <p className="text-danger text-sm">{formError}</p>}

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Create Product"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
