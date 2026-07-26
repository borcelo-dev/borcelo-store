"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import Image from "next/image";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import { ProductSchema } from "@/lib/schemas/product";
import { createCategory } from "@/lib/data-access/categories";
import { uploadProductImage } from "@/lib/data-access/products";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export type ProductFormValues = {
  name: string;
  barcode: string;
  categoryName: string;
  unitPrice: string;
  quantity: string;
  bufferQuantity: string;
  imageUrl: string | null;
};

export type ProductFormSubmitData = {
  name: string;
  barcode: string | null;
  categoryName: string;
  unitPrice: number;
  quantity: number;
  bufferQuantity: number;
  imageUrl: string | null;
};

type Props = {
  mode: "create" | "edit";
  categories: { id: string; name: string }[];
  initialValues: ProductFormValues;
  submitLabel: string;
  submittingLabel: string;
  onSubmit: (data: ProductFormSubmitData) => Promise<void>;
  onCancel: () => void;
};

export default function ProductForm({
  mode,
  categories,
  initialValues,
  submitLabel,
  submittingLabel,
  onSubmit,
  onCancel,
}: Props) {
  const [form, setForm] = useState(initialValues);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageError("");
    if (file) {
      if (!file.type.startsWith("image/")) {
        setImageError("Please choose an image file.");
        e.target.value = "";
        setImageFile(null);
        return;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        setImageError("Image must be smaller than 5MB.");
        e.target.value = "";
        setImageFile(null);
        return;
      }
    }
    setImageFile(file);
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

  const validate = (): ProductFormSubmitData | null => {
    const errors: Record<string, string> = {};

    const unitPrice = parseFloat(form.unitPrice);
    if (form.unitPrice.trim() === "" || Number.isNaN(unitPrice)) {
      errors.unitPrice = "Price is required.";
    }

    const bufferQuantity = parseInt(form.bufferQuantity, 10);
    if (form.bufferQuantity.trim() === "" || Number.isNaN(bufferQuantity)) {
      errors.bufferQuantity = "Buffer quantity is required.";
    }

    let quantity = parseInt(form.quantity, 10);
    if (mode === "create" && (form.quantity.trim() === "" || Number.isNaN(quantity))) {
      errors.quantity = "Initial stock is required.";
    }
    if (Number.isNaN(quantity)) quantity = 0;

    if (!Object.keys(errors).length) {
      const result = ProductSchema.safeParse({
        name: form.name.trim(),
        barcode: form.barcode.trim() || null,
        categoryName: form.categoryName,
        unitPrice,
        quantity,
        bufferQuantity,
      });
      if (!result.success) {
        for (const issue of result.error.issues) {
          const key = String(issue.path[0]);
          if (!errors[key]) errors[key] = issue.message;
        }
      }
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length) return null;

    return {
      name: form.name.trim(),
      barcode: form.barcode.trim() || null,
      categoryName: form.categoryName,
      unitPrice,
      quantity,
      bufferQuantity,
      imageUrl: form.imageUrl,
    };
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");

    const parsed = validate();
    if (!parsed) return;

    setSubmitting(true);
    try {
      let imageUrl = parsed.imageUrl;
      if (imageFile) {
        imageUrl = await uploadProductImage(imageFile);
      }
      await onSubmit({ ...parsed, imageUrl });
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        id="name"
        label="Product Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        error={fieldErrors.name}
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
        {fieldErrors.categoryName && (
          <p className="text-danger text-sm mt-1">{fieldErrors.categoryName}</p>
        )}
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
        error={fieldErrors.unitPrice}
        required
      />

      <div className="grid grid-cols-2 gap-4">
        {mode === "create" && (
          <Input
            id="quantity"
            label="Initial Stock"
            type="number"
            min="0"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            error={fieldErrors.quantity}
          />
        )}
        <div className={mode === "edit" ? "col-span-2" : ""}>
          <Input
            id="bufferQuantity"
            label="Buffer Quantity"
            type="number"
            min="1"
            value={form.bufferQuantity}
            onChange={(e) => setForm({ ...form, bufferQuantity: e.target.value })}
            error={fieldErrors.bufferQuantity}
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-semibold text-ink">Product Image (optional)</label>
        <div className="flex items-center gap-3 mt-1.5">
          {form.imageUrl && !imageFile && (
            <Image
              src={form.imageUrl}
              alt=""
              width={48}
              height={48}
              className="w-12 h-12 rounded-2px object-cover shrink-0"
            />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full text-sm text-ink-muted file:mr-4 file:py-2 file:px-4 file:rounded-2px file:border file:border-border file:bg-surface file:text-ink file:text-sm file:font-semibold hover:file:bg-surface-muted"
          />
        </div>
        {imageError && <p className="text-danger text-sm mt-1">{imageError}</p>}
        {!imageFile && form.imageUrl && (
          <p className="text-ink-muted text-xs mt-1">Current image will be kept unless you choose a new one.</p>
        )}
      </div>

      {formError && <p className="text-danger text-sm">{formError}</p>}

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting || !!imageError}>
          {submitting ? submittingLabel : submitLabel}
        </Button>
      </div>
    </form>
  );
}
