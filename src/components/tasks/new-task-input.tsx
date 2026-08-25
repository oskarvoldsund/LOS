"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createTask } from "@/lib/actions/tasks";
import { toast } from "sonner";

export function NewTaskInput({ defaultStatus }: { defaultStatus?: "inbox" | "todo" }) {
  const [value, setValue] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    const title = value.trim();
    if (!title || pending) return;
    startTransition(async () => {
      try {
        await createTask({ title, status: defaultStatus });
        setValue("");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't add task.");
      }
    });
  }

  return (
    <div className="flex items-center gap-2 rounded-md border bg-background px-2">
      <Plus className="size-4 shrink-0 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="Add a task…"
        className="h-9 border-none px-0 shadow-none focus-visible:ring-0"
      />
      <Button size="sm" variant="ghost" disabled={pending || !value.trim()} onClick={submit}>
        Add
      </Button>
    </div>
  );
}
