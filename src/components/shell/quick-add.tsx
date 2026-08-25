"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { parseQuickAdd } from "@/lib/parsing/quick-add";
import { quickAdd } from "@/lib/actions/quick-add";
import { toast } from "sonner";

export function QuickAdd() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const preview = useMemo(() => (value.trim() ? parseQuickAdd(value) : null), [value]);

  function closeAndReset() {
    setOpen(false);
    setValue("");
  }

  function submit() {
    const text = value.trim();
    if (!text || pending) return;
    startTransition(async () => {
      try {
        const result = await quickAdd(text);
        toast.success(
          result.kind === "workout" ? `Workout added: ${result.title}` : `Task added: ${result.title}`,
        );
        closeAndReset();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't add that.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : closeAndReset())}>
      <DialogContent className="top-1/3 translate-y-0 gap-3 p-4 sm:max-w-lg" showCloseButton={false}>
        <DialogHeader className="sr-only">
          <DialogTitle>Quick Add</DialogTitle>
        </DialogHeader>
        <Input
          autoFocus
          placeholder="Pay electricity bill Friday…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
            if (e.key === "Escape") closeAndReset();
          }}
          className="h-11 border-none text-base shadow-none focus-visible:ring-0"
        />
        <div className="flex min-h-6 items-center gap-2 px-1 text-xs text-muted-foreground">
          {preview ? (
            <>
              <Badge variant="secondary" className="capitalize">
                {preview.kind}
              </Badge>
              <span>{preview.title}</span>
              {preview.dueDate ? <span>· due {preview.dueDate}</span> : null}
              {preview.scheduledDate ? <span>· {preview.scheduledDate}</span> : null}
              {preview.distanceKm ? <span>· {preview.distanceKm} km</span> : null}
            </>
          ) : (
            <span>Type a task or workout, press Enter. Everything else can be organized later.</span>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
