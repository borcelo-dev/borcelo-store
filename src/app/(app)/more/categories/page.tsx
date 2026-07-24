"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onCategoriesChange, createCategory } from "@/lib/data-access/categories";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { ArrowLeft, Plus, Layers } from "lucide-react";

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const unsub = onCategoriesChange(setCategories);
    return unsub;
  }, []);

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    setAdding(true);
    try {
      await createCategory(name);
      setNewName("");
    } catch {
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="py-6 space-y-4">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-ink-muted hover:text-ink transition-colors"
      >
        <ArrowLeft size={20} />
        <span className="text-sm font-semibold">Back</span>
      </button>

      <h1 className="font-heading font-bold text-2xl">Categories</h1>

      <div className="flex gap-2">
        <Input
          id="new-category"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New category name"
          className="flex-1"
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <Button onClick={handleAdd} disabled={adding || !newName.trim()}>
          <Plus size={20} className="mr-1" />
          Add
        </Button>
      </div>

      {categories.length === 0 ? (
        <Card>
          <p className="text-ink-muted text-center py-8">No categories yet.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {categories.map((c) => (
            <Card key={c.id} className="flex items-center gap-3">
              <Layers size={20} className="text-purple" />
              <span className="font-semibold">{c.name}</span>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
