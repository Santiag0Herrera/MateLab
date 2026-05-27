"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, Loader2 } from "lucide-react";

export function ExerciseAnalysis() {
  const router = useRouter();
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [exerciseData, setExerciseData] = useState<any>(null);

  useEffect(() => {
    const pending = localStorage.getItem("pending-exercise");
    if (!pending) {
      router.push("/upload");
      return;
    }

    const data = JSON.parse(pending);
    setExerciseData(data);

    // Simulate analysis delay
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 2000);
  }, [router]);

  const handleSave = () => {
    if (!exerciseData) return;

    // Get existing exercises
    const stored = localStorage.getItem("matelab-exercises");
    const exercises = stored ? JSON.parse(stored) : [];

    // Create new exercise
    const newExercise = {
      id: String(Date.now()),
      topic: exerciseData.topic,
      source: "Subido por alumno",
      difficulty: "Media",
      statement: exerciseData.statement,
      concepts: ["regla del producto", "derivadas trigonométricas"],
    };

    // Add and save
    exercises.push(newExercise);
    localStorage.setItem("matelab-exercises", JSON.stringify(exercises));
    localStorage.removeItem("pending-exercise");

    router.push("/confirmation");
  };

  if (!exerciseData) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto p-6">
        {/* Header */}
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

        {/* Analysis Card */}
        <div className="bg-card border border-border rounded-xl p-6">
          {isAnalyzing ? (
            <div className="text-center py-12">
              <Loader2 className="size-12 mx-auto mb-4 text-primary animate-spin" />
              <h3 className="mb-2">Analizando ejercicio...</h3>
              <p className="text-muted-foreground">
                Estamos estimando la dificultad y detectando los conceptos involucrados.
              </p>
            </div>
          ) : (
            <>
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
                  <p>{exerciseData.statement}</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-blue-800 text-sm">
                  <strong>Recordá:</strong> La dificultad es una estimación inicial y puede ajustarse con el uso.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  className="flex-1 bg-primary text-primary-foreground py-3 px-6 rounded-lg hover:opacity-90 transition-opacity"
                >
                  Guardar ejercicio
                </button>
                <button
                  onClick={() => router.push("/upload")}
                  className="flex-1 border border-border py-3 px-6 rounded-lg hover:bg-muted transition-colors"
                >
                  Editar datos
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
