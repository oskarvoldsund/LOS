"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { createDiaryEntry } from "@/lib/actions/diary";
import { toast } from "sonner";

/**
 * Quick capture only — deliberately not PIN-gated (only the diary overview
 * at /diary is). Writing a private note stays frictionless; reading back
 * everything you've written is what's behind the PIN.
 */
export function NewDiaryEntryDialog({ date, trigger }: { date: string; trigger: React.ReactElement }) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    const text = body.trim();
    if (!text) return;
    startTransition(async () => {
      try {
        await createDiaryEntry({ entryDate: date, body: text });
        toast.success("Saved.");
        setBody("");
        setOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't save that.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Diary — {date}</DialogTitle>
        </DialogHeader>
        <Textarea
          autoFocus
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
          placeholder="What's on your mind…"
        />
        <DialogFooter>
          <Button onClick={submit} disabled={pending || !body.trim()}>
            {pending ? "Saving…" : "Save entry"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
