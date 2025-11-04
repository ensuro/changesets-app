import React, { createContext, useContext } from "react";
import {
  SafeProvider as UpstreamSafeProvider,
  useSafeAppsSDK,
} from "@safe-global/safe-apps-react-sdk";

/*
 * Wrap the SDK Safe Provider for easier testing.
 *
 * Normally no setup is needed. When running in dev mode and the environment REACT_APP_STANDALONE is
 * set, that safe address will be used instead of trying to contact a parent iframe.
 */

export const standAloneMode =
  import.meta.env.VITE_STANDALONE !== undefined && !import.meta.env.PROD;

const defaultStandalone = {
  safeAddress: import.meta.env.VITE_STANDALONE || "",
  chainId: import.meta.env.VITE_STANDALONE_CHAIN_ID
    ? Number(import.meta.env.VITE_STANDALONE_CHAIN_ID)
    : 11155111,
  threshold: 1,
  owners: [
    "0x4eB328c10A601A5EA68461097C2A82E80b7f46a1",
    "0x4c56A8EFdd7aFd6A708641e3754801fE0538eb80",
  ],
  isReadOnly: true,
};

const SafeContext = createContext(
  standAloneMode
    ? defaultStandalone
    : { safeAddress: "", chainId: 1, threshold: 1, owners: [], isReadOnly: true }
);

export const useSafe = standAloneMode
  ? () => useContext(SafeContext)
  : () => {
      const { safe } = useSafeAppsSDK();
      return safe;
    };

const SafeProvider = standAloneMode
  ? ({ children }) => (
      <SafeContext.Provider value={defaultStandalone}>{children}</SafeContext.Provider>
    )
  : UpstreamSafeProvider;

export default SafeProvider;
