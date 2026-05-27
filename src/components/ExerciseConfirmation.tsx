"use client";

import { useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";

export function ExerciseConfirmation() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 text-green-600 p-4 rounded-full">
              <CheckCircle className="size-12" />
            </div>
          </div>

          <h2 className="mb-3">Ejercicio cargado correctamente</h2>

          <p className="text-muted-foreground mb-6">
            El ejercicio ya está disponible en el listado para que otros estudiantes puedan resolverlo.
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push("/exercises")}
              className="w-full bg-primary text-primary-foreground py-3 px-6 rounded-lg hover:opacity-90 transition-opacity"
            >
              Ver en listado
            </button>
            <button
              onClick={() => router.push("/upload")}
              className="w-full border border-border py-3 px-6 rounded-lg hover:bg-muted transition-colors"
            >
              Cargar otro ejercicio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
