"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload } from "lucide-react";

const AVAILABLE_TOPICS = [
  "Derivadas",
  "Límites",
  "Integrales",
  "Funciones",
  "Matrices",
  "Ecuaciones",
  "Álgebra",
  "Probabilidad"
];

export function ExerciseUpload() {
  const router = useRouter();
  const [selectedTopic, setSelectedTopic] = useState("Derivadas");
  const [statement, setStatement] = useState("");
  const [source, setSource] = useState("Ejercicio de guía");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Store data in localStorage for the analysis screen
    localStorage.setItem("pending-exercise", JSON.stringify({
      topic: selectedTopic,
      statement,
      source,
    }));

    router.push("/analysis");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto p-6">
        {/* Header */}
        <button
          onClick={() => router.push("/exercises")}
          className="flex items-center gap-2 mb-6 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-5" />
          Volver al listado
        </button>

        <div className="mb-8">
          <h1 className="mb-2">Cargar nuevo ejercicio</h1>
          <p className="text-muted-foreground">
            Subí un ejercicio para que otros estudiantes puedan practicar este tema.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6">
          <div className="space-y-6">
            <div>
              <label className="block mb-2">Tema de estudio</label>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full bg-input-background border border-border rounded-lg p-3"
              >
                {AVAILABLE_TOPICS.map((topic) => (
                  <option key={topic} value={topic}>{topic}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2">Enunciado del ejercicio</label>
              <textarea
                value={statement}
                onChange={(e) => setStatement(e.target.value)}
                placeholder="Escribí el enunciado completo del ejercicio..."
                required
                rows={6}
                className="w-full bg-input-background border border-border rounded-lg p-3 resize-none"
              />
            </div>

            <div>
              <label className="block mb-2">Fuente</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full bg-input-background border border-border rounded-lg p-3"
              >
                <option value="Ejercicio de guía">Ejercicio de guía</option>
                <option value="Ejercicio propio">Ejercicio propio</option>
              </select>
            </div>

            <div>
              <label className="block mb-2">Archivo o imagen opcional</label>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer">
                <Upload className="size-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Hacé clic para subir una imagen del ejercicio (opcional)
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm">
                <strong>Nota:</strong> La dificultad será estimada por la app a partir del enunciado del ejercicio.
              </p>
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-6 bg-primary text-primary-foreground py-3 px-6 rounded-lg hover:opacity-90 transition-opacity"
          >
            Analizar y cargar ejercicio
          </button>
        </form>
      </div>
    </div>
  );
}
