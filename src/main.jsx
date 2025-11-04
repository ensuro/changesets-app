import React from "react";
import ReactDOM from "react-dom/client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, CssBaseline } from "@mui/material";

import SafeProvider from "./safe-ui";
import SafeThemeProvider from "./theme/SafeThemeProvider";
import WalletProvider from "./wallet";
import App from "./App";

// (opcional) polyfills si alguna lib usa Buffer/process en browser
// import { Buffer } from "buffer";
// if (!window.Buffer) window.Buffer = Buffer;
// if (!globalThis.process) globalThis.process = { env: {} };

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false } },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <SafeThemeProvider mode="dark">
      {(safeTheme) => (
        <ThemeProvider theme={safeTheme}>
          <CssBaseline />
          <SafeProvider>
            <WalletProvider>
              <QueryClientProvider client={queryClient}>
                <App />
              </QueryClientProvider>
            </WalletProvider>
          </SafeProvider>
        </ThemeProvider>
      )}
    </SafeThemeProvider>
  </React.StrictMode>
);
