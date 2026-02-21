"use client";

import { createContext } from "react";
import type { SetteraDeepLinkContextValue } from "@settera/react";

export type { SetteraDeepLinkContextValue } from "@settera/react";

export const SetteraDeepLinkContext =
  createContext<SetteraDeepLinkContextValue | null>(null);
