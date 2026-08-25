"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { unlockDiary } from "@/lib/actions/diary";
import { toast } from "sonner";

export function UnlockDiaryForm() {
  const [pin, setPin] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit() {
    if (!pin) return;
    startTransition(async () => {
      const { ok } = await unlockDiary(pin);
      if (ok) {
        router.refresh();
      } else {
        toast.error("Wrong PIN.");
        setPin("");
      }
    });
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-4 py-16 text-center">
      <Lock className="size-8 text-muted-foreground" />
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Enter your PIN</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your diary is locked.</p>
      </div>
      <div className="flex w-full gap-2">
        <Input
          type="password"
          inputMode="numeric"
          autoFocus
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        <Button onClick={submit} disabled={pending || !pin}>
          {pending ? "Checking…" : "Unlock"}
        </Button>
      </div>
    </div>
  );
}
