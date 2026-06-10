"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getStudentSession, saveStudentSession } from "../lib/studentIdentity";

export function LoginScreen() {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Si ya hay sesión activa, redirigir directo
  useEffect(() => {
    if (getStudentSession()) {
      router.replace("/exercises");
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = studentId.trim().toUpperCase();
    if (!cleanId) return;

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/students?studentId=${encodeURIComponent(cleanId)}`);
      const data = await res.json();

      if (!res.ok) {
        setError("ID no encontrado. Verificá que esté bien escrito.");
        return;
      }

      saveStudentSession({ publicStudentId: data.publicStudentId, nombre: data.nombre || cleanId });
      router.replace("/exercises");
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="mb-2">MateLab</h1>
          <p className="text-muted-foreground">Ingresá tu ID de estudiante para continuar</p>
        </div>

        <form onSubmit={handleLogin} className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-2">ID de estudiante</label>
            <input
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="ML-XXXXXXXX"
              autoComplete="off"
              spellCheck={false}
              className="w-full bg-background border border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary uppercase tracking-wide"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !studentId.trim()}
            className="w-full bg-primary text-primary-foreground py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading && <Loader2 className="size-4 animate-spin" />}
            {isLoading ? "Verificando..." : "Ingresar"}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Tu ID lo generó la app la primera vez que la usaste.
        </p>
      </div>
    </div>
  );
}
