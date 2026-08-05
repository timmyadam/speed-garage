import type { ReactElement } from "react";
import { CompassIcon } from "@phosphor-icons/react/dist/ssr";
import { EmptyState } from "@/components/common";
import { LinkButton } from "@/components/dashboard/LinkButton";

export default function NotFound(): ReactElement {
  return (
    <EmptyState
      icon={<CompassIcon weight="duotone" className="size-7" />}
      title="Pagina nu există"
      description="Adresa pe care ai deschis-o nu duce nicăieri. Probabil mașina căutată nu e în catalog."
      action={
        <LinkButton href="/" variant="primary">
          Înapoi acasă
        </LinkButton>
      }
    />
  );
}
