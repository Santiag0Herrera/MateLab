"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  Check,
  Copy,
  Globe2,
  Loader2,
  Lock,
  LogOut,
  Swords,
  Target,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "./ui/sidebar";
import {
  getStudentSession,
  clearStudentSession,
  saveStudentSession,
} from "../lib/studentIdentity";

const NAV_ITEMS = [
  { href: "/exercises", label: "Ejercicios", icon: BookOpen },
  { href: "/challenges", label: "Mis desafíos", icon: Swords },
  { href: "/results", label: "Resultados", icon: BarChart3 },
  { href: "/preparation", label: "Preparación", icon: Target },
];

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [myStudentId, setMyStudentId] = useState("");
  const [myStudentName, setMyStudentName] = useState("");
  const [copiedId, setCopiedId] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);
  const [privacyError, setPrivacyError] = useState("");

  useEffect(() => {
    const session = getStudentSession();
    const studentId = session?.publicStudentId ?? "";
    setMyStudentId(studentId);
    setMyStudentName(session?.nombre ?? "");
    setIsPublic(session?.isPublic !== false);

    if (studentId) {
      fetch(`/api/students?studentId=${encodeURIComponent(studentId)}`)
        .then(async (response) => {
          const payload = await response.json();
          if (!response.ok) throw new Error();

          const nextIsPublic = payload.isPublic !== false;
          setIsPublic(nextIsPublic);
          saveStudentSession({
            publicStudentId: payload.publicStudentId,
            nombre: payload.nombre || session?.nombre || studentId,
            isPublic: nextIsPublic,
          });
        })
        .catch(() => {});
    }
  }, []);

  const handleCopyMyId = async () => {
    if (!myStudentId) return;

    await navigator.clipboard.writeText(myStudentId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 1800);
  };

  const handlePrivacyChange = async () => {
    const nextIsPublic = !isPublic;
    setIsUpdatingPrivacy(true);
    setPrivacyError("");

    try {
      const response = await fetch("/api/students", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: myStudentId, isPublic: nextIsPublic }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "No se pudo actualizar la privacidad.");
      }

      setIsPublic(payload.isPublic !== false);
      saveStudentSession({
        publicStudentId: payload.publicStudentId,
        nombre: payload.nombre || myStudentName || myStudentId,
        isPublic: payload.isPublic !== false,
      });
    } catch (error) {
      setPrivacyError(
        error instanceof Error ? error.message : "No se pudo actualizar la privacidad."
      );
    } finally {
      setIsUpdatingPrivacy(false);
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center justify-center px-2 py-1 group-data-[collapsible=icon]:px-0">
          <div className="size-10 rounded-lg overflow-hidden bg-black shrink-0 group-data-[collapsible=icon]:size-8">
            <img
              src="/logo.jpeg"
              alt="PathPrep IA"
              className="w-full h-full object-cover object-[center_35%] scale-150"
            />
          </div>
          <span className="ml-2 font-medium truncate group-data-[collapsible=icon]:hidden">
            PathPrep <span className="text-primary">IA</span>
          </span>
        </div>
        <div className="px-2 py-1 group-data-[collapsible=icon]:hidden">
          <p className="font-medium truncate">{myStudentName || myStudentId}</p>
          <p className="text-xs text-muted-foreground truncate">{myStudentId}</p>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handlePrivacyChange}
              disabled={isUpdatingPrivacy || !myStudentId}
              tooltip={isPublic ? "Perfil público" : "Perfil privado"}
            >
              {isUpdatingPrivacy ? (
                <Loader2 className="animate-spin" />
              ) : isPublic ? (
                <Globe2 className="text-green-600" />
              ) : (
                <Lock className="text-muted-foreground" />
              )}
              <span>Perfil {isPublic ? "público" : "privado"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleCopyMyId} tooltip="Copiar ID">
              {copiedId ? <Check className="text-green-600" /> : <Copy />}
              <span>{copiedId ? "Copiado" : "Copiar ID"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {privacyError && (
          <p className="px-2 text-xs text-red-700 group-data-[collapsible=icon]:hidden">
            {privacyError}
          </p>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {NAV_ITEMS.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  onClick={() => router.push(item.href)}
                  isActive={pathname === item.href}
                  tooltip={item.label}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => {
                clearStudentSession();
                router.push("/login");
              }}
              tooltip="Cerrar sesión"
            >
              <LogOut />
              <span>Cerrar sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
