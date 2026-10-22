import { getCurrentUser } from "@/lib/firebase/get-current-user";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your account",
};

export default async function AuthLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  if (await getCurrentUser()) redirect("/");
  return <>{children}</>;
}
