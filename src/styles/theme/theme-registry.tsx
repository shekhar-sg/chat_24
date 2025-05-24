"use client";
import { useAppSelector } from "@/store/hooks";
import generateTheme from "@/styles/theme";
import { ThemeProvider } from "@mui/material";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import CssBaseline from "@mui/material/CssBaseline";
import { type ReactNode, useMemo } from "react";

export interface ThemeRegistryProps {
  children: ReactNode;
}

const ThemeRegistry = (props: ThemeRegistryProps) => {
  const { children } = props;
  const themeMode = useAppSelector(({ appConfig }) => appConfig.themeMode);

  const theme = useMemo(() => generateTheme(themeMode), [themeMode]);

  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline enableColorScheme />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
};

export default ThemeRegistry;
