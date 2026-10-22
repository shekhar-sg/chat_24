import StoreProvider from "@/store/Provider";
import ThemeRegistry from "@/styles/theme/theme-registry";
import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Agent Chat",
  description: "A chat application for agents",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

const RootLayout = async ({
  children,
}: Readonly<{
  children: ReactNode;
}>) => {
  const cookie = await cookies();
  const cookieThemeMode = cookie.get("themeMode")?.value;
  return (
    <html lang="en" suppressHydrationWarning>
      <StoreProvider
        cookieThemeMode={cookieThemeMode as "dark" | "light" | undefined}
      >
        <ThemeRegistry>
          <body>{children}</body>
        </ThemeRegistry>
      </StoreProvider>
    </html>
  );
};

export default RootLayout;
