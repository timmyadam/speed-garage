"use client";

import { useEffect, type ReactElement } from "react";
import { WarningOctagonIcon } from "@phosphor-icons/react/dist/ssr";
import { Button, EmptyState } from "@/components/common";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): ReactElement {
  useEffect(() => {
    console.error("Speed Garage — eroare de randare:", error);
  }, [error]);

  return (
    <EmptyState
      icon={<WarningOctagonIcon weight="duotone" className="size-7" />}
      title="Ceva s-a rupt pe traseu"
      description="Pagina nu a putut fi randată. Progresul salvat în browser nu este afectat — poți încerca din nou."
      action={
        <Button variant="primary" onClick={reset}>
          Încearcă din nou
        </Button>
      }
    />
  );
}
