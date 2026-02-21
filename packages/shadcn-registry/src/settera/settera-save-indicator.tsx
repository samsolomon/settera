"use client";

import React from "react";
import { CheckIcon } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import type { SaveStatus } from "@settera/react";
import { useSetteraLabels } from "./settera-labels";

export interface SetteraSaveIndicatorProps {
  saveStatus: SaveStatus;
}

export function SetteraSaveIndicator({ saveStatus }: SetteraSaveIndicatorProps) {
  const labels = useSetteraLabels();

  if (saveStatus === "saving") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium leading-none text-muted-foreground">
        <Spinner className="size-3" />
        {labels.saving}
      </span>
    );
  }

  if (saveStatus === "saved") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium leading-none dark:bg-green-950"
        style={{ color: "var(--settera-success-color, #16a34a)" }}
      >
        <CheckIcon className="size-3" />
        {labels.saved}
      </span>
    );
  }

  return null;
}
