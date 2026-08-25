"use client";

import { useTransition } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteEvent } from "@/lib/actions/calendar";

export function DeleteEventButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      size="icon"
      variant="ghost"
      className="size-5 shrink-0 opacity-0 group-hover:opacity-100"
      disabled={pending}
      onClick={() => startTransition(() => deleteEvent(id))}
    >
      <X className="size-3" />
    </Button>
  );
}
