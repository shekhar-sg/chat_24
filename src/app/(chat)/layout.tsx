import ChatLayout from "@/app/(chat)/ChatLayout";
import { getCurrentUser } from "@/lib/firebase/get-current-user";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import SessionGuard from "@/components/SessionGuard";

const Layout = async ({ children }: { children: ReactNode }) => {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <SessionGuard>
      <ChatLayout>{children}</ChatLayout>
    </SessionGuard>
  );
};

export default Layout;
