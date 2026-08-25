"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function QuickAddTrigger() {
  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5 text-muted-foreground"
      onClick={() => {
        document.dispatchEvent(
          new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }),
        );
      }}
    >
      <Plus className="size-4" />
      Quick add
      <kbd className="hidden rounded border bg-muted px-1 font-mono text-[10px] sm:inline">⌘K</kbd>
    </Button>
  );
}
