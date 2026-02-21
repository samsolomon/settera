"use client";

import React from "react";
import { CheckIcon } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import type { SaveStatus } from "@settera/react";

export interface SetteraSaveIndicatorProps {
  saveStatus: SaveStatus;
}

export function SetteraSaveIndicator({ saveStatus }: SetteraSaveIndicatorProps) {
  if (saveStatus === "saving") {
    return <Spinner className="size-3.5 text-muted-foreground" />;
  }

  if (saveStatus === "saved") {
    return <CheckIcon className="size-3.5" style={{ color: "var(--settera-success-color, #16a34a)" }} />;
  }

  return null;
}
