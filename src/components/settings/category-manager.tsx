"use client";

import { useState, useTransition } from "react";
import { X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createCategory, deleteCategory } from "@/lib/actions/categories";
import type { Tables } from "@/lib/types";

export function CategoryManager({ categories }: { categories: Tables<"categories">[] }) {
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();

  function add() {
    const trimmed = name.trim();
    if (!trimmed) return;
    startTransition(async () => {
      await createCategory(trimmed);
      setName("");
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <Badge key={c.id} variant="secondary" className="gap-1 pr-1">
            {c.name}
            <button
              onClick={() => startTransition(() => deleteCategory(c.id))}
              className="rounded-full p-0.5 hover:bg-background/60"
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="New category"
          className="h-8 max-w-48"
        />
        <Button size="sm" variant="outline" className="gap-1" disabled={pending || !name.trim()} onClick={add}>
          <Plus className="size-3.5" />
          Add
        </Button>
      </div>
    </div>
  );
}
