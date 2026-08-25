"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { setDiaryPin } from "@/lib/actions/diary";
import { toast } from "sonner";

export function SetDiaryPinForm() {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit() {
    if (pin.length < 4) {
      toast.error("PIN must be at least 4 characters.");
      return;
    }
    if (pin !== confirmPin) {
      toast.error("PINs don't match.");
      return;
    }
    startTransition(async () => {
      try {
        await setDiaryPin(pin);
        toast.success("PIN set.");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't set that PIN.");
      }
    });
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-4 py-16 text-center">
      <Lock className="size-8 text-muted-foreground" />
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Protect your diary</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Set a PIN before you can view your diary entries. Writing new entries from Home never
          needs it — this only gates reading them back.
        </p>
      </div>
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Set a PIN</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5 text-left">
            <Label htmlFor="pin">PIN</Label>
            <Input
              id="pin"
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>
          <div className="flex flex-col gap-1.5 text-left">
            <Label htmlFor="pin-confirm">Confirm PIN</Label>
            <Input
              id="pin-confirm"
              type="password"
              inputMode="numeric"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>
          <Button onClick={submit} disabled={pending}>
            {pending ? "Saving…" : "Set PIN"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
