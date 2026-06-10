"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Loader2, ImageIcon, X } from "lucide-react";
import { Exercise } from "../data/exercises";
import { getOrCreateStudentId } from "../lib/studentIdentity";

interface EvaluationResult {
  score?: number;
  corrections?: string[];
  feedback?: string;
  solutionText?: string;
  isFallback?: boolean;
}

interface PendingChallenge {
  _id: string;
  senderId: string;
}

interface SavedSolution {
  _id: string;
  evaluation?: EvaluationResult;
  createdAt?: string;
}

export function ExerciseSolve({ id, challengeId }: { id: string; challengeId?: string }) {
  const router = useRouter();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState("");
  const [studentId, setStudentId] = useState("");
  const [pendingChallenge, setPendingChallenge] = useState<PendingChallenge | null>(null);
  const [isCheckingChallenge, setIsCheckingChallenge] = useState(true);
  const [savedSolution, setSavedSolution] = useState<SavedSolution | null>(null);
  const [isCheckingSolution, setIsCheckingSolution] = useState(true);

  useEffect(() => {
    fetch(`/api/exercises/${id}`)
      .then(async (res) => {
        if (!res.ok) { setNotFound(true); return; }
        setExercise(await res.json());
      })
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false));

    const currentStudentId = getOrCreateStudentId();
    setStudentId(currentStudentId);
    setIsCheckingSolution(true);

    fetch(
      `/api/solutions/status?studentId=${encodeURIComponent(currentStudentId)}&exerciseId=${encodeURIComponent(id)}`
    )
      .then(async (response) => {
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "No se pudo verificar si el ejercicio ya fue resuelto.");
        }

        setSavedSolution(payload.solution || null);
      })
      .catch(() => {
        setSavedSolution(null);
      })
      .finally(() => setIsCheckingSolution(false));

    if (challengeId) {
      setIsCheckingChallenge(false);
      return;
    }

    fetch(
      `/api/challenges/pending?studentId=${encodeURIComponent(currentStudentId)}&exerciseId=${encodeURIComponent(id)}`
    )
      .then(async (response) => {
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "No se pudo verificar el estado del desafío.");
        }

        setPendingChallenge(payload.pendingChallenge || null);
      })
      .catch(() => {
        setPendingChallenge(null);
      })
      .finally(() => setIsCheckingChallenge(false));
  }, [id, challengeId]);

  const applyImage = (file: File) => {
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      applyImage(e.target.files[0]);
    }
  };

  const handleClearImage = () => {
    setImage(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      applyImage(file);
    }
  };

  const handleSave = async () => {
    if (!exercise || !image) return;

    setIsEvaluating(true);
    setError("");

    let result: EvaluationResult | null = null;

    try {
      const form = new FormData();
      form.append("image", image);
      form.append("exerciseId", id);
      form.append("topic", exercise.topic ?? "");
      form.append("statement", exercise.statement);

      const response = await fetch("/api/evaluate-exercise", {
        method: "POST",
        body: form,
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "No se pudo evaluar la resolución.");
      }

      result = payload.evaluation;
      setEvaluation(result);

      const saveResponse = await fetch("/api/solutions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          challengeId,
          exerciseId: id,
          exerciseStatement: exercise.statement,
          exerciseTopic: exercise.topic,
          studentId,
          imageAttached: true,
          solutionText: result?.solutionText || "",
          evaluation: result,
        }),
      });

      const savePayload = await saveResponse.json();

      if (!saveResponse.ok) {
        throw new Error(savePayload.error || "La resolución fue evaluada, pero no se pudo guardar.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo evaluar la resolución.";
      setError(message);
      setIsEvaluating(false);
      return;
    }

    setIsEvaluating(false);
    setShowConfirmation(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !exercise) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto p-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 mb-6 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-5" />
            Volver
          </button>
          <p className="text-muted-foreground">Ejercicio no encontrado</p>
        </div>
      </div>
    );
  }

  if (showConfirmation) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto p-6">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="bg-green-50 border border-green-200 rounded-full p-6 mb-6">
              <Check className="size-16 text-green-600" />
            </div>

            <h2 className="mb-3">Resolución guardada correctamente</h2>

            <p className="text-muted-foreground text-center mb-8">
              Tu resolución fue evaluada y almacenada exitosamente.
            </p>

            {evaluation && (
              <div className="bg-card border border-border rounded-xl p-6 mb-6 max-w-2xl w-full text-left">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <h3>Corrección de IA</h3>
                  {typeof evaluation.score === "number" && (
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full">
                      Puntaje: {evaluation.score}/100
                    </span>
                  )}
                </div>

                {evaluation.feedback && (
                  <p className="text-muted-foreground mb-4">{evaluation.feedback}</p>
                )}

                {evaluation.corrections && evaluation.corrections.length > 0 && (
                  <ul className="list-disc pl-5 space-y-2">
                    {evaluation.corrections.map((correction, index) => (
                      <li key={index}>{correction}</li>
                    ))}
                  </ul>
                )}

                {evaluation.isFallback && (
                  <p className="text-sm text-muted-foreground mt-4">
                    Configurá N8N_WEBHOOK_URL para recibir una evaluación real del flujo de n8n.
                  </p>
                )}
              </div>
            )}

            <button
              onClick={() => router.push(`/exercise/${id}`)}
              className="bg-primary text-primary-foreground py-3 px-8 rounded-lg hover:opacity-90 transition-opacity"
            >
              Volver al ejercicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto p-6">
        {/* Header */}
        <button
          onClick={() => router.push(`/exercise/${id}`)}
          className="flex items-center gap-2 mb-6 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-5" />
          Volver al ejercicio
        </button>

        <h1 className="mb-8">Resolver ejercicio</h1>

        {savedSolution && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-6">
            <h3 className="text-green-900 mb-2">Ya resolviste este ejercicio</h3>
            <p className="text-green-800 mb-4">
              No podés cargar otra resolución para el mismo ejercicio.
            </p>
            {typeof savedSolution.evaluation?.score === "number" && (
              <p className="text-green-900 font-medium mb-4">
                Puntaje obtenido: {savedSolution.evaluation.score}/100
              </p>
            )}
            <button
              onClick={() => router.push("/results")}
              className="bg-primary text-primary-foreground py-2 px-4 rounded-lg hover:opacity-90 transition-opacity"
            >
              Ver mis resultados
            </button>
          </div>
        )}

        {challengeId && (
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-6">
            <p className="text-primary font-medium">Estás resolviendo un desafío</p>
          </div>
        )}

        {!challengeId && pendingChallenge && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 mb-6">
            <h3 className="text-yellow-900 mb-2">Este ejercicio tiene un desafío pendiente</h3>
            <p className="text-yellow-800 mb-4">
              {pendingChallenge.senderId} te desafió con este ejercicio. Para resolverlo, entrá desde
              Mis desafíos así queda asociado al desafío correcto.
            </p>
            <button
              onClick={() => router.push("/challenges")}
              className="bg-primary text-primary-foreground py-2 px-4 rounded-lg hover:opacity-90 transition-opacity"
            >
              Ir a Mis desafíos
            </button>
          </div>
        )}

        {/* Enunciado del ejercicio */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <p className="text-sm text-muted-foreground mb-2">Enunciado</p>
          <p className="text-lg">{exercise.statement}</p>
        </div>

        {/* Zona de carga de imagen */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <p className="text-lg font-medium mb-3">Tu resolución</p>

          {image && imagePreview ? (
            <div className="relative min-h-[400px] flex flex-col items-center justify-center gap-4">
              <img
                src={imagePreview}
                alt="Preview de la resolución"
                className="max-h-[340px] object-contain rounded-lg border border-border"
              />
              <div className="flex items-center gap-3">
                <p className="text-sm text-muted-foreground">{image.name}</p>
                <button
                  type="button"
                  onClick={handleClearImage}
                  className="flex items-center gap-1 text-sm text-destructive hover:opacity-80 transition-opacity"
                >
                  <X className="size-4" />
                  Quitar
                </button>
              </div>
            </div>
          ) : (
            <label
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center min-h-[400px] rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/30"
              }`}
            >
              <ImageIcon className="size-12 text-muted-foreground mb-4" />
              <p className="font-medium text-center">Arrastrá tu imagen aquí</p>
              <p className="text-sm text-muted-foreground mt-1">
                o hacé clic para seleccionar un archivo
              </p>
              <p className="text-xs text-muted-foreground mt-3">
                JPG, PNG, WEBP · Máx. 10 MB
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Botón guardar */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={
            !image ||
            !studentId ||
            isEvaluating ||
            !!savedSolution ||
            isCheckingSolution ||
            isCheckingChallenge ||
            (!!pendingChallenge && !challengeId)
          }
          className="w-full bg-primary text-primary-foreground py-4 px-6 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isEvaluating && <Loader2 className="size-5 animate-spin" />}
          {isEvaluating ? "Evaluando con IA..." : "Enviar y corregir resolución"}
        </button>
      </div>
    </div>
  );
}
