import { useMemo, createElement } from "react";
import { ThemeProvider } from "@mui/material";
import createSafeTheme from "./safeTheme";
const SafeThemeProvider = ({ children, mode }) => {
  const theme = useMemo(() => createSafeTheme(mode), [mode]);
  return createElement(ThemeProvider, { theme: theme }, children(theme));
};
export default SafeThemeProvider;
