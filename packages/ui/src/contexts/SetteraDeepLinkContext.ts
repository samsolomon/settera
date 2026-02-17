import { createContext } from "react";

export interface SetteraDeepLinkContextValue {
  getSettingUrl: (settingKey: string) => string;
}

export const SetteraDeepLinkContext =
  createContext<SetteraDeepLinkContextValue | null>(null);
