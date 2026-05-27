"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Inbox, Send } from "lucide-react";
import { getOrCreateStudentId } from "../lib/studentIdentity";

interface Challenge {
  _id: string;
  exerciseId: string;
  exerciseStatement: string;
  exerciseTopic: string;
  senderId: string;
  recipientId: string;
  message: string;
  status: string;
  winnerId?: string | null;
  isTie?: boolean;
  solutions?: ChallengeSolution[];
  solvedByCurrentStudent?: boolean;
  createdAt: string;
}

interface ChallengeSolution {
  _id: string;
  studentId: string;
  solutionText: string;
  evaluation?: {
    score?: number;
    feedback?: string;
    corrections?: string[];
  };
}

export function ChallengeInbox() {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [received, setReceived] = useState<Challenge[]>([]);
  const [sent, setSent] = useState<Challenge[]>([]);
  const [activeTab, setActiveTab] = useState<"received" | "sent">("received");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const id = getOrCreateStudentId();
    setStudentId(id);

    fetch(`/api/challenges?studentId=${encodeURIComponent(id)}`)
      .then(async (response) => {
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "No se pudieron cargar los desafíos.");
        }

        setReceived(payload.received || []);
        setSent(payload.sent || []);
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : "No se pudieron cargar los desafíos.";
        setError(message);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const challenges = activeTab === "received" ? received : sent;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto p-6">
        <button
          onClick={() => router.push("/exercises")}
          className="flex items-center gap-2 mb-6 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-5" />
          Volver a ejercicios
        </button>

        <div className="mb-8">
          <h1 className="mb-2">Mis desafíos</h1>
          <p className="text-muted-foreground">
            Tu ID es <span className="text-foreground">{studentId}</span>
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-2 mb-6 inline-flex gap-2">
          <button
            onClick={() => setActiveTab("received")}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              activeTab === "received" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            <Inbox className="size-4" />
            Recibidos ({received.length})
          </button>
          <button
            onClick={() => setActiveTab("sent")}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              activeTab === "sent" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            <Send className="size-4" />
            Enviados ({sent.length})
          </button>
        </div>

        {isLoading && (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <p className="text-muted-foreground">Cargando desafíos...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <p className="text-red-700">{error}</p>
            <p className="text-red-700 text-sm mt-2">
              Revisá que MONGODB_URI esté configurado en .env.local y reiniciá Next.
            </p>
          </div>
        )}

        {!isLoading && !error && challenges.length === 0 && (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <p className="text-muted-foreground">
              {activeTab === "received"
                ? "Todavía no recibiste desafíos."
                : "Todavía no enviaste desafíos."}
            </p>
          </div>
        )}

        {!isLoading && !error && challenges.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {challenges.map((challenge) => (
              <ChallengeCard
                key={challenge._id}
                challenge={challenge}
                currentStudentId={studentId}
                activeTab={activeTab}
                onSolve={() => router.push(`/solve/${challenge.exerciseId}?challenge=${challenge._id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ChallengeCard({
  challenge,
  currentStudentId,
  activeTab,
  onSolve,
}: {
  challenge: Challenge;
  currentStudentId: string;
  activeTab: "received" | "sent";
  onSolve: () => void;
}) {
  const senderSolution = challenge.solutions?.find(
    (solution) => solution.studentId.toUpperCase() === challenge.senderId.toUpperCase()
  );
  const recipientSolution = challenge.solutions?.find(
    (solution) => solution.studentId.toUpperCase() === challenge.recipientId.toUpperCase()
  );
  const normalizedCurrentStudentId = currentStudentId.toUpperCase();
  const currentStudentSolution =
    normalizedCurrentStudentId === challenge.senderId.toUpperCase()
      ? senderSolution
      : normalizedCurrentStudentId === challenge.recipientId.toUpperCase()
        ? recipientSolution
        : undefined;
  const opponentId =
    normalizedCurrentStudentId === challenge.senderId.toUpperCase()
      ? challenge.recipientId
      : challenge.senderId;
  const opponentSolved =
    opponentId === challenge.senderId ? !!senderSolution : !!recipientSolution;
  const currentStudentSolved = !!currentStudentSolution;

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
          {challenge.exerciseTopic || "Ejercicio"}
        </span>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(challenge.status)}`}>
            {getStatusText(challenge.status)}
          </span>
          <span className="text-sm text-muted-foreground">
            {new Date(challenge.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      <p className="mb-4">{challenge.exerciseStatement}</p>

      <div className="bg-muted/50 border border-border rounded-lg p-3 mb-4">
        <p className="text-sm text-muted-foreground mb-1">
          {activeTab === "received" ? "Enviado por" : "Enviado a"}
        </p>
        <p>
          {activeTab === "received" ? challenge.senderId : challenge.recipientId}
        </p>
      </div>

      {challenge.status !== "completed" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <ParticipantStatus
            label="Tu estado"
            solved={currentStudentSolved}
          />
          <ParticipantStatus
            label={`Estado de ${opponentId}`}
            solved={opponentSolved}
          />
        </div>
      )}

      {challenge.status !== "completed" && currentStudentSolution && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <p className="text-green-900 font-medium mb-1">
            Tu respuesta ya está cargada
            {typeof currentStudentSolution.evaluation?.score === "number"
              ? ` · ${currentStudentSolution.evaluation.score}/100`
              : ""}
          </p>
          <p className="text-green-800 text-sm whitespace-pre-line">
            {currentStudentSolution.solutionText}
          </p>
        </div>
      )}

      {challenge.message && (
        <p className="text-sm text-muted-foreground mb-4">{challenge.message}</p>
      )}

      {challenge.status === "completed" && (
        <ChallengeSummary challenge={challenge} currentStudentId={currentStudentId} />
      )}

      {challenge.status !== "completed" && (
        <button
          onClick={onSolve}
          disabled={currentStudentSolved}
          className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {currentStudentSolved ? `Esperando a ${opponentId}` : "Resolver desafío"}
        </button>
      )}
    </div>
  );
}

function ParticipantStatus({ label, solved }: { label: string; solved: boolean }) {
  return (
    <div className="bg-muted/50 border border-border rounded-lg p-3">
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <p className={solved ? "text-green-700 font-medium" : "text-yellow-700 font-medium"}>
        {solved ? "Resuelto" : "Pendiente"}
      </p>
    </div>
  );
}

function ChallengeSummary({
  challenge,
  currentStudentId,
}: {
  challenge: Challenge;
  currentStudentId: string;
}) {
  const senderSolution = challenge.solutions?.find(
    (solution) => solution.studentId === challenge.senderId
  );
  const recipientSolution = challenge.solutions?.find(
    (solution) => solution.studentId === challenge.recipientId
  );

  return (
    <div className="border-t border-border pt-4 mt-4">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
        <p className="text-green-900 font-medium">
          {challenge.isTie
            ? "El desafío terminó empatado"
            : `Ganador: ${challenge.winnerId === currentStudentId ? "Vos" : challenge.winnerId}`}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <SolutionSummary
          label={challenge.senderId === currentStudentId ? "Tu respuesta" : "Respuesta del desafiante"}
          studentId={challenge.senderId}
          solution={senderSolution}
        />
        <SolutionSummary
          label={challenge.recipientId === currentStudentId ? "Tu respuesta" : "Respuesta del compañero"}
          studentId={challenge.recipientId}
          solution={recipientSolution}
        />
      </div>
    </div>
  );
}

function SolutionSummary({
  label,
  studentId,
  solution,
}: {
  label: string;
  studentId: string;
  solution?: ChallengeSolution;
}) {
  return (
    <div className="bg-muted/50 border border-border rounded-lg p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          <p className="text-sm">{studentId}</p>
        </div>
        <span className="bg-card border border-border rounded-full px-3 py-1 text-sm">
          {typeof solution?.evaluation?.score === "number"
            ? `${solution.evaluation.score}/100`
            : "Sin puntaje"}
        </span>
      </div>

      <p className="text-sm mb-3 whitespace-pre-line">
        {solution?.solutionText || "Sin respuesta cargada"}
      </p>

      {solution?.evaluation?.feedback && (
        <p className="text-sm text-muted-foreground">{solution.evaluation.feedback}</p>
      )}
    </div>
  );
}

function getStatusText(status: string) {
  switch (status) {
    case "completed":
      return "Terminado";
    case "in-progress":
      return "En curso";
    default:
      return "Pendiente";
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "completed":
      return "text-green-700 bg-green-50";
    case "in-progress":
      return "text-yellow-700 bg-yellow-50";
    default:
      return "text-muted-foreground bg-muted";
  }
}
