"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { getOrCreateStudentId } from "../lib/studentIdentity";
import { MathText } from "./MathText";

export function ExerciseAnalysis() {
  const router = useRouter();
  const [exerciseData, setExerciseData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    const pending = localStorage.getItem("pending-exercise");
    if (!pending) {
      router.push("/upload");
      return;
    }
    setExerciseData(JSON.parse(pending));
  }, [router]);

  const handleSave = async () => {
    if (!exerciseData) return;

    setIsSaving(true);
    setSaveError("");

    try {
      const response = await fetch("/api/exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: exerciseData.topic,
          statement: exerciseData.statement,
          source: "Subido por alumno",
          difficulty: "Media",
          concepts: ["regla del producto", "derivadas trigonométricas"],
          uploadedBy: getOrCreateStudentId(),
        }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || "No se pudo guardar el ejercicio.");
      }

      const saved = await response.json();

      const stored = localStorage.getItem("matelab-exercises");
      const exercises = stored ? JSON.parse(stored) : [];
      exercises.push({
        id: saved.id,
        topic: saved.topic,
        source: "Subido por alumno",
        difficulty: "Media",
        statement: saved.statement,
        concepts: saved.concepts,
      });
      localStorage.setItem("matelab-exercises", JSON.stringify(exercises));
      localStorage.removeItem("pending-exercise");

      router.push("/confirmation");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo guardar el ejercicio.";
      setSaveError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  if (!exerciseData) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto p-6">
        <button
          onClick={() => router.push("/upload")}
          className="flex items-center gap-2 mb-6 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-5" />
          Volver
        </button>

        <div className="mb-8">
          <h1 className="mb-2">Análisis del ejercicio</h1>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6 text-green-600">
            <CheckCircle className="size-6" />
            <h3>Análisis completado</h3>
          </div>

          <div className="space-y-4 mb-6">
            <div className="bg-muted/50 border border-border rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Tema detectado</p>
                  <p className="font-medium">{exerciseData.topic}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Dificultad estimada</p>
                  <p className="font-medium">Media</p>
                </div>
              </div>
            </div>

            <div className="bg-muted/50 border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">Conceptos involucrados</p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                  regla del producto
                </span>
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                  derivadas trigonométricas
                </span>
              </div>
            </div>

            <div className="bg-muted/50 border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">Enunciado</p>
              <MathText content={exerciseData.statement} />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 text-sm">
              <strong>Recordá:</strong> La dificultad es una estimación inicial y puede ajustarse con el uso.
            </p>
          </div>

          {saveError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-700 text-sm">{saveError}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 bg-primary text-primary-foreground py-3 px-6 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSaving && <Loader2 className="size-4 animate-spin" />}
              {isSaving ? "Guardando..." : "Guardar ejercicio"}
            </button>
            <button
              onClick={() => router.push("/upload")}
              className="flex-1 border border-border py-3 px-6 rounded-lg hover:bg-muted transition-colors"
            >
              Editar datos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
