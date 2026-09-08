import ChatLayout from "@/app/(chat)/ChatLayout";
import { getCurrentUser } from "@/lib/get-current-user";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

const Layout = async ({ children }: { children: ReactNode }) => {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return <ChatLayout>{children}</ChatLayout>;
};

export default Layout;
