"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getStudentSession } from "../lib/studentIdentity";
import { AppSidebar } from "./AppSidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "./ui/sidebar";

const PUBLIC_ROUTES = ["/login"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (PUBLIC_ROUTES.includes(pathname)) {
      setReady(true);
      return;
    }
    if (!getStudentSession()) {
      router.replace("/login");
    } else {
      setReady(true);
    }
  }, [pathname, router]);

  if (!ready) return null;

  if (PUBLIC_ROUTES.includes(pathname)) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SidebarTrigger className="m-2" />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
