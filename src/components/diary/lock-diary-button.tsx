"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { lockDiary } from "@/lib/actions/diary";

export function LockDiaryButton() {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      size="sm"
      variant="ghost"
      className="gap-1.5 text-muted-foreground"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await lockDiary();
          router.refresh();
        })
      }
    >
      <Lock className="size-3.5" />
      Lock
    </Button>
  );
}
