import React from "react";
import ReactDOM from "react-dom/client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, CssBaseline } from "@mui/material";

import SafeProvider from "./safe-ui";
import SafeThemeProvider from "./theme/SafeThemeProvider";
import WalletProvider from "./wallet";
import App from "./App";

const queryClient = new QueryClient();

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
