"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Users } from "lucide-react";
import { Exercise } from "../data/exercises";
import { getOrCreateStudentId } from "../lib/studentIdentity";

interface ExerciseStatus {
  solution?: {
    solutionText?: string;
    evaluation?: {
      score?: number;
      feedback?: string;
      corrections?: string[];
    };
  } | null;
  latestChallenge?: {
    status: string;
    opponentId: string;
    winnerId?: string | null;
    isTie?: boolean;
    role: "sender" | "recipient";
  } | null;
}

export function ExerciseDetail({ id }: { id: string }) {
  const router = useRouter();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [status, setStatus] = useState<ExerciseStatus | null>(null);

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

    fetch(`/api/exercise-status?studentId=${encodeURIComponent(currentStudentId)}`)
      .then(async (response) => {
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "No se pudo cargar el estado del ejercicio.");
        }

        setStatus(payload.statuses?.[id] || null);
      })
      .catch(() => setStatus(null));
  }, [id]);

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
        <div className="max-w-4xl mx-auto p-6">
          <button
            onClick={() => router.push("/exercises")}
            className="flex items-center gap-2 mb-6 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-5" />
            Volver al listado
          </button>
          <p className="text-muted-foreground">Ejercicio no encontrado</p>
        </div>
      </div>
    );
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Baja": return "text-green-600 bg-green-50";
      case "Media": return "text-yellow-600 bg-yellow-50";
      case "Alta": return "text-red-600 bg-red-50";
      default: return "text-muted-foreground bg-muted";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <button
          onClick={() => router.push("/exercises")}
          className="flex items-center gap-2 mb-6 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-5" />
          Volver al listado
        </button>

        {/* Exercise Details */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <span className="bg-primary/10 text-primary px-4 py-2 rounded-full">
              {exercise.topic}
            </span>
            <span className={`px-4 py-2 rounded-full ${getDifficultyColor(exercise.difficulty)}`}>
              Dificultad: {exercise.difficulty}
            </span>
          </div>

          <h2 className="mb-4">Enunciado</h2>
          <p className="text-lg mb-6">{exercise.statement}</p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-muted/50 border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Fuente</p>
              <p className="font-medium">{exercise.source}</p>
            </div>

            {exercise.concepts && exercise.concepts.length > 0 && (
              <div className="bg-muted/50 border border-border rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-2">Conceptos involucrados</p>
                <div className="flex flex-wrap gap-2">
                  {exercise.concepts.map((concept, idx) => (
                    <span
                      key={idx}
                      className="bg-primary/10 text-primary px-2 py-1 rounded text-sm"
                    >
                      {concept}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {status?.solution && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-green-900 font-medium">Ya resolviste este ejercicio</p>
                {typeof status.solution.evaluation?.score === "number" && (
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    {status.solution.evaluation.score}/100
                  </span>
                )}
              </div>
              {status.solution.solutionText && (
                <div className="border-t border-green-200 pt-2 mt-2">
                  <p className="text-green-700 text-xs font-semibold uppercase tracking-wide mb-1">Tu respuesta:</p>
                  <div className="text-green-900 text-sm space-y-0.5">
                    {status.solution.solutionText.replace(/\\n/g, "\n").split("\n").map((line, i) => (
                      <p key={i}>{line || " "}</p>
                    ))}
                  </div>
                </div>
              )}
              {(status.solution.evaluation?.feedback || (status.solution.evaluation?.corrections?.length ?? 0) > 0) && (
                <div className="border-t border-green-200 pt-2 mt-2">
                  <p className="text-green-700 text-xs font-semibold uppercase tracking-wide mb-2">Análisis:</p>
                  {status.solution.evaluation?.feedback && (
                    <p className="text-green-800 text-sm mb-2">{status.solution.evaluation.feedback}</p>
                  )}
                  {status.solution.evaluation?.corrections && status.solution.evaluation.corrections.length > 0 && (
                    <ul className="space-y-1">
                      {status.solution.evaluation.corrections.map((correction, idx) => (
                        <li key={idx} className="text-green-900 text-sm flex gap-2">
                          <span className="text-green-600 font-medium flex-shrink-0">{idx + 1}.</span>
                          {correction}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}

          {status?.latestChallenge && (
            <div className="bg-muted/50 border border-border rounded-lg p-4 mb-6">
              <p className="text-sm text-muted-foreground mb-1">
                Desafío con <span className="text-foreground">{status.latestChallenge.opponentId}</span>
              </p>
              <p className="font-medium">{getChallengeSummary(status.latestChallenge, studentId)}</p>
            </div>
          )}

          <button
            onClick={() => router.push(`/solve/${id}`)}
            disabled={!!status?.solution}
            className="w-full bg-primary text-primary-foreground py-3 px-6 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status?.solution ? "Ejercicio resuelto" : "Comenzar resolución"}
          </button>
        </div>

        <button
          onClick={() => router.push(`/challenge/${id}`)}
          className="w-full bg-card border-2 border-primary rounded-xl p-5 flex items-start gap-3 hover:bg-primary/5 transition-colors text-left"
        >
          <Users className="size-7 text-primary flex-shrink-0 mt-1" />
          <div>
            <h3 className="mb-1 text-foreground">Desafiar a un compañero</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Invitá a otro estudiante a resolver este ejercicio y comparar resultados.
            </p>
            <p className="text-xs text-primary font-medium">
              Disponible aunque ya hayas terminado otro desafío
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}

function getChallengeSummary(challenge: NonNullable<ExerciseStatus["latestChallenge"]>, currentStudentId: string) {
  if (challenge.status === "completed") {
    if (challenge.isTie) return "Terminado · empate";
    return `Terminado · ganador: ${challenge.winnerId === currentStudentId ? "vos" : challenge.winnerId}`;
  }

  if (challenge.status === "in-progress") return "En curso";

  return challenge.role === "recipient" ? "Pendiente para resolver" : "Pendiente del compañero";
}
