import type { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your account",
};

export default function AuthLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return <>{children}</>;
}
