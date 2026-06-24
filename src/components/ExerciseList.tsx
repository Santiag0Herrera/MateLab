"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  BookOpenCheck,
  Check,
  Copy,
  Globe2,
  Loader2,
  Lock,
  Plus,
  Target,
} from "lucide-react";
import { Exercise } from "../data/exercises";
import {
  getStudentSession,
  clearStudentSession,
  saveStudentSession,
} from "../lib/studentIdentity";

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
  const [myStudentName, setMyStudentName] = useState("");
  const [copiedId, setCopiedId] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);
  const [privacyError, setPrivacyError] = useState("");
  const [exerciseStatuses, setExerciseStatuses] = useState<Record<string, ExerciseStatus>>({});

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

  const sources = ["Todas", "Precargado", "Subido por alumno", "Generado por IA"];
  const difficulties = ["Todas", "Baja", "Media", "Alta", "Pendiente de análisis"];

  const filteredExercises = exercises.filter(ex => {
    if (topicFilter !== "Todos" && ex.topic !== topicFilter) return false;
    if (sourceFilter !== "Todas" && ex.source !== sourceFilter) return false;
    if (difficultyFilter !== "Todas" && ex.difficulty !== difficultyFilter) return false;
    return true;
  });

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
      <div className="max-w-7xl mx-auto p-6">
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

        <div className="bg-card border border-border rounded-xl p-4 mb-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex-1">
              <p className="font-medium">{myStudentName || myStudentId}</p>
              <p className="text-xs text-muted-foreground">{myStudentId}</p>
            </div>
            <button
              onClick={handlePrivacyChange}
              disabled={isUpdatingPrivacy || !myStudentId}
              className="border border-border py-2 px-4 rounded-lg hover:bg-muted transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              title={isPublic ? "Podés aparecer en búsquedas y recibir desafíos" : "No aparecés en búsquedas ni recibís desafíos"}
            >
              {isUpdatingPrivacy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : isPublic ? (
                <Globe2 className="size-4 text-green-600" />
              ) : (
                <Lock className="size-4 text-muted-foreground" />
              )}
              Perfil {isPublic ? "público" : "privado"}
            </button>
            <button
              onClick={handleCopyMyId}
              className="border border-border py-2 px-4 rounded-lg hover:bg-muted transition-colors flex items-center justify-center gap-2"
            >
              {copiedId ? <Check className="size-4 text-green-600" /> : <Copy className="size-4" />}
              {copiedId ? "Copiado" : "Copiar ID"}
            </button>
            <button
              onClick={() => router.push("/challenges")}
              className="bg-primary text-primary-foreground py-2 px-4 rounded-lg hover:opacity-90 transition-opacity"
            >
              Mis desafíos
            </button>
            <button
              onClick={() => router.push("/results")}
              className="border border-border py-2 px-4 rounded-lg hover:bg-muted transition-colors flex items-center justify-center gap-2"
            >
              <BarChart3 className="size-4" />
              Resultados
            </button>
            <button
              onClick={() => router.push("/preparation")}
              className="border border-border py-2 px-4 rounded-lg hover:bg-muted transition-colors flex items-center justify-center gap-2"
            >
              <Target className="size-4" />
              Preparación
            </button>
            <button
              onClick={() => { clearStudentSession(); router.push("/login"); }}
              className="border border-border py-2 px-4 rounded-lg hover:bg-muted transition-colors text-sm text-muted-foreground"
            >
              Cerrar sesión
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            {isPublic
              ? "Tu perfil aparece en la búsqueda y otros estudiantes pueden desafiarte."
              : "Tu perfil no aparece en la búsqueda y no pueden enviarte desafíos nuevos."}
          </p>
          {privacyError && <p className="text-sm text-red-700 mt-2">{privacyError}</p>}
        </div>

        {/* Upload Button */}
        <div className="mb-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => router.push("/upload")}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <Plus className="size-5" />
            Cargar nuevo ejercicio
          </button>
          <button
            onClick={() => router.push("/exam-setup")}
            className="border border-border px-6 py-3 rounded-lg hover:bg-muted transition-colors flex items-center justify-center gap-2"
          >
            <BookOpenCheck className="size-5" />
            Configurar examen
          </button>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-xl p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          </div>
        </div>

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

      <p className="mb-3 min-h-[3rem]">{exercise.statement}</p>

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
