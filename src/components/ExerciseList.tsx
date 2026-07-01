"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Plus, SlidersHorizontal } from "lucide-react";
import { AVAILABLE_TOPICS, Exercise } from "../data/exercises";
import { MathText } from "./MathText";
import { getStudentSession } from "../lib/studentIdentity";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

interface ExerciseStatus {
  solution?: {
    evaluation?: {
      score?: number;
      feedback?: string;
    };
  } | null;
  latestChallenge?: {
    status: string;
    opponentId: string;
    opponentName?: string;
    winnerId?: string | null;
    isTie?: boolean;
    role: "sender" | "recipient";
  } | null;
}

export function ExerciseList() {
  const router = useRouter();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [sourceFilter, setSourceFilter] = useState<string>("Todas");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("Todas");
  const [topicFilter, setTopicFilter] = useState<string>("Todos");
  const [myStudentId, setMyStudentId] = useState("");
  const [exerciseStatuses, setExerciseStatuses] = useState<Record<string, ExerciseStatus>>({});
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetch("/api/exercises")
      .then(async (res) => {
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (Array.isArray(data)) setExercises(data);
      })
      .catch(() => {});

    const session = getStudentSession();
    const studentId = session?.publicStudentId ?? "";
    setMyStudentId(studentId);

    fetch(`/api/exercise-status?studentId=${encodeURIComponent(studentId)}`)
      .then(async (response) => {
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "No se pudo cargar el estado de ejercicios.");
        }

        setExerciseStatuses(payload.statuses || {});
      })
      .catch(() => {
        setExerciseStatuses({});
      });
  }, []);

  const sources = ["Todas", "Precargado", "Subido por alumno", "Generado por IA"];
  const difficulties = ["Todas", "Baja", "Media", "Alta", "Pendiente de análisis"];

  const filteredExercises = exercises.filter(ex => {
    if (topicFilter !== "Todos" && ex.topic !== topicFilter) return false;
    if (sourceFilter !== "Todas" && ex.source !== sourceFilter) return false;
    if (difficultyFilter !== "Todas" && ex.difficulty !== difficultyFilter) return false;
    return true;
  });

  const activeFilterCount = [
    topicFilter !== "Todos",
    sourceFilter !== "Todas",
    difficultyFilter !== "Todas",
  ].filter(Boolean).length;

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
      <div className="max-w-7xl mx-auto p-6 pb-[52px]">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="size-8 text-primary" />
            <h1>Ejercicios</h1>
          </div>
          <p className="text-muted-foreground">
            Todos los ejercicios disponibles. Filtrá por tema de estudio si querés practicar algo específico.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => setShowFilters(true)}
            className="border border-border px-4 py-2 rounded-lg hover:bg-muted transition-colors flex items-center justify-center gap-2"
          >
            <SlidersHorizontal className="size-4" />
            Filtros
            {activeFilterCount > 0 && (
              <span className="bg-primary text-primary-foreground text-xs font-medium rounded-full size-5 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        <Dialog open={showFilters} onOpenChange={setShowFilters}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Filtros</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm">Tema</label>
                <select
                  value={topicFilter}
                  onChange={(e) => setTopicFilter(e.target.value)}
                  className="w-full bg-input-background border border-border rounded-lg p-2"
                >
                  <option value="Todos">Todos</option>
                  {AVAILABLE_TOPICS.map(topic => (
                    <option key={topic} value={topic}>{topic}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2 text-sm">Fuente</label>
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="w-full bg-input-background border border-border rounded-lg p-2"
                >
                  {sources.map(source => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2 text-sm">Dificultad estimada</label>
                <select
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                  className="w-full bg-input-background border border-border rounded-lg p-2"
                >
                  {difficulties.map(diff => (
                    <option key={diff} value={diff}>{diff}</option>
                  ))}
                </select>
              </div>

              {activeFilterCount > 0 && (
                <button
                  onClick={() => {
                    setTopicFilter("Todos");
                    setSourceFilter("Todas");
                    setDifficultyFilter("Todas");
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Exercise Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {filteredExercises.map(exercise => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              status={exerciseStatuses[exercise.id]}
              onOpen={() => router.push(`/exercise/${exercise.id}`)}
              getDifficultyColor={getDifficultyColor}
              currentStudentId={myStudentId}
            />
          ))}
        </div>
      </div>

      <button
        onClick={() => router.push("/upload")}
        aria-label="Cargar ejercicio"
        title="Cargar ejercicio"
        className="fixed bottom-6 right-6 z-40 bg-primary text-primary-foreground pl-4 pr-5 py-3 rounded-lg text-sm shadow-[0_8px_20px_-4px_rgba(0,0,0,0.35)] hover:shadow-[0_10px_24px_-4px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-1.5"
      >
        <Plus className="size-4" />
        Cargar ejercicio
      </button>
    </div>
  );
}

function ExerciseCard({
  exercise,
  status,
  onOpen,
  getDifficultyColor,
  currentStudentId,
}: {
  exercise: Exercise;
  status?: ExerciseStatus;
  onOpen: () => void;
  getDifficultyColor: (difficulty: string) => string;
  currentStudentId: string;
}) {
  const score = status?.solution?.evaluation?.score;
  const challenge = status?.latestChallenge;

  const scoreTheme =
    typeof score !== "number" ? null :
    score >= 75 ? { card: "bg-green-50 border-green-200", text: "text-green-900", label: "Muy bien" } :
    score >= 50 ? { card: "bg-yellow-50 border-yellow-200", text: "text-yellow-900", label: "Parcial" } :
    { card: "bg-red-50 border-red-200", text: "text-red-900", label: "A revisar" };

  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
          {exercise.topic}
        </span>
        <span className={`px-3 py-1 rounded-full text-sm ${getDifficultyColor(exercise.difficulty)}`}>
          {exercise.difficulty}
        </span>
      </div>

      <MathText content={exercise.statement} className="mb-3 min-h-[3rem]" />

      <div className="text-sm text-muted-foreground mb-4">
        <span className="font-medium">Fuente:</span> {exercise.source}
      </div>

      {scoreTheme && (
        <div className={`${scoreTheme.card} border rounded-lg p-3 mb-4 flex items-center justify-between`}>
          <p className={`${scoreTheme.text} font-medium`}>{scoreTheme.label}</p>
          <span className={`${scoreTheme.text} text-sm font-semibold`}>{score}/100</span>
        </div>
      )}

      {challenge && (
        <div className="bg-muted/50 border border-border rounded-lg p-3 mb-4">
          <p className="text-sm text-muted-foreground mb-1">Desafío con</p>
          <p className="font-medium">{challenge.opponentName || challenge.opponentId}</p>
          {challenge.opponentName && (
            <p className="text-xs text-muted-foreground">{challenge.opponentId}</p>
          )}
          <p className="text-sm mt-1">{getChallengeSummary(challenge, currentStudentId)}</p>
        </div>
      )}

      <button
        onClick={onOpen}
        className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-lg hover:opacity-90 transition-opacity"
      >
        Abrir ejercicio
      </button>
    </div>
  );
}

function getChallengeSummary(challenge: NonNullable<ExerciseStatus["latestChallenge"]>, currentStudentId: string) {
  if (challenge.status === "completed") {
    if (challenge.isTie) return "Terminado · empate";
    const winnerDisplay = challenge.winnerId === currentStudentId
    ? "vos"
    : (challenge.opponentId === challenge.winnerId ? (challenge.opponentName || challenge.winnerId) : challenge.winnerId);
  return `Terminado · ganador: ${winnerDisplay}`;
  }

  if (challenge.status === "in-progress") return "En curso";

  return challenge.role === "recipient" ? "Pendiente para resolver" : "Pendiente del compañero";
}
