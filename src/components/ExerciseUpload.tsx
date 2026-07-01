"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, HelpCircle, Upload } from "lucide-react";
import { MathText } from "./MathText";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";

const FORMAT_EXAMPLES = [
  { label: "Potencia", code: "x^2" },
  { label: "Raíz", code: "\\sqrt{x}" },
  { label: "Fracción", code: "\\frac{a}{b}" },
  { label: "Límite", code: "\\lim_{x \\to 0}" },
  { label: "Integral", code: "\\int_{a}^{b} f(x)\\,dx" },
  { label: "Derivada", code: "\\frac{d}{dx}f(x)" },
];

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
  const [showFormatHelp, setShowFormatHelp] = useState(false);

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
              <div className="flex items-center justify-between mb-2">
                <label>Enunciado del ejercicio</label>
                <button
                  type="button"
                  onClick={() => setShowFormatHelp(true)}
                  className="flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <HelpCircle className="size-4" />
                  ¿Cómo escribo fórmulas?
                </button>
              </div>
              <textarea
                value={statement}
                onChange={(e) => setStatement(e.target.value)}
                placeholder="Escribí el enunciado completo del ejercicio..."
                required
                rows={6}
                className="w-full bg-input-background border border-border rounded-lg p-3 resize-none"
              />
              {statement.trim() && (
                <div className="mt-2 bg-muted/50 border border-border rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Vista previa</p>
                  <MathText content={statement} />
                </div>
              )}
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

      <Dialog open={showFormatHelp} onOpenChange={setShowFormatHelp}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>¿Cómo escribo fórmulas?</DialogTitle>
            <DialogDescription>
              Envolvé las fórmulas con <code>$...$</code> para expresiones dentro del texto, o{" "}
              <code>$$...$$</code> para que ocupen un bloque aparte. El resto del enunciado se
              escribe en español normal.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-900">
            <strong>Importante:</strong> usá un solo backslash por comando (<code>\frac</code>,{" "}
            <code>\sqrt</code>), nunca <code>\\frac</code> con doble backslash. Si copiás el
            enunciado desde otro lado, revisá que no se hayan duplicado las barras.
          </div>

          <div className="space-y-3">
            {FORMAT_EXAMPLES.map((example) => (
              <div
                key={example.label}
                className="flex items-center justify-between gap-4 bg-muted/50 border border-border rounded-lg p-3"
              >
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{example.label}</p>
                  <code className="text-sm">${example.code}$</code>
                </div>
                <MathText content={`$${example.code}$`} />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
