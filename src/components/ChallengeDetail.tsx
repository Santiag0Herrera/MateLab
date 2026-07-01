"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { getOrCreateStudentId } from "../lib/studentIdentity";
import { MathText } from "./MathText";

interface ChallengeSolution {
  _id: string;
  studentId: string;
  solutionText?: string;
  evaluation?: {
    score?: number;
    feedback?: string;
    corrections?: string[];
  };
}

interface ChallengeData {
  _id: string;
  exerciseId: string;
  exerciseStatement: string;
  exerciseTopic: string;
  senderId: string;
  senderName?: string;
  recipientId: string;
  recipientName?: string;
  message: string;
  status: string;
  winnerId?: string | null;
  isTie?: boolean;
  solutions?: ChallengeSolution[];
  createdAt: string;
}

export function ChallengeDetail({ id }: { id: string }) {
  const router = useRouter();
  const [challenge, setChallenge] = useState<ChallengeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [studentId, setStudentId] = useState("");

  useEffect(() => {
    const currentStudentId = getOrCreateStudentId();
    setStudentId(currentStudentId);

    fetch(`/api/challenges/${id}`)
      .then(async (res) => {
        if (!res.ok) { setNotFound(true); return; }
        setChallenge(await res.json());
      })
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !challenge) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-6">
          <button
            onClick={() => router.push("/challenges")}
            className="flex items-center gap-2 mb-6 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-5" />
            Volver a desafíos
          </button>
          <p className="text-muted-foreground">Desafío no encontrado</p>
        </div>
      </div>
    );
  }

  const normalizedStudentId = studentId.toUpperCase();
  const senderSolution = challenge.solutions?.find(
    (s) => s.studentId.toUpperCase() === challenge.senderId.toUpperCase()
  );
  const recipientSolution = challenge.solutions?.find(
    (s) => s.studentId.toUpperCase() === challenge.recipientId.toUpperCase()
  );
  const currentStudentSolution =
    normalizedStudentId === challenge.senderId.toUpperCase()
      ? senderSolution
      : normalizedStudentId === challenge.recipientId.toUpperCase()
        ? recipientSolution
        : undefined;
  const opponentId =
    normalizedStudentId === challenge.senderId.toUpperCase()
      ? challenge.recipientId
      : challenge.senderId;
  const currentStudentSolved = !!currentStudentSolution;
  const opponentSolution =
    normalizedStudentId === challenge.senderId.toUpperCase()
      ? recipientSolution
      : senderSolution;
  const opponentSolved = !!opponentSolution;

  const isCompleted = challenge.status === "completed";

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        <button
          onClick={() => router.push("/challenges")}
          className="flex items-center gap-2 mb-6 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-5" />
          Volver a desafíos
        </button>

        <div className="flex items-center gap-3 mb-6">
          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
            {challenge.exerciseTopic || "Ejercicio"}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(challenge.status)}`}>
            {getStatusText(challenge.status)}
          </span>
          <span className="text-sm text-muted-foreground ml-auto">
            {new Date(challenge.createdAt).toLocaleDateString()}
          </span>
        </div>

        {/* Enunciado */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <p className="text-sm text-muted-foreground mb-2">Enunciado</p>
          <MathText content={challenge.exerciseStatement} className="text-lg" />
        </div>

        {/* Participantes */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Desafiante</p>
              <p className="font-medium">{challenge.senderName || challenge.senderId}</p>
              {challenge.senderName && (
                <p className="text-xs text-muted-foreground mt-0.5">{challenge.senderId}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Retador</p>
              <p className="font-medium">{challenge.recipientName || challenge.recipientId}</p>
              {challenge.recipientName && (
                <p className="text-xs text-muted-foreground mt-0.5">{challenge.recipientId}</p>
              )}
            </div>
          </div>
          {challenge.message && (
            <p className="text-sm text-muted-foreground mt-4 pt-4 border-t border-border">
              {challenge.message}
            </p>
          )}
        </div>

        {/* Estado y resultado */}
        {isCompleted ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-6">
            <p className="text-green-900 font-medium">
              {challenge.isTie
                ? "El desafío terminó empatado"
                : (() => {
                    const winnerId = challenge.winnerId;
                    if (winnerId === studentId) return "Ganador: Vos";
                    const winnerName =
                      winnerId === challenge.senderId
                        ? challenge.senderName || challenge.senderId
                        : winnerId === challenge.recipientId
                          ? challenge.recipientName || challenge.recipientId
                          : winnerId;
                    return `Ganador: ${winnerName}`;
                  })()}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <ParticipantStatus
              label="Tu estado"
              solved={currentStudentSolved}
            />
            <ParticipantStatus
              label={`Estado de ${
                opponentId === challenge.senderId
                  ? challenge.senderName || challenge.senderId
                  : challenge.recipientName || challenge.recipientId
              }`}
              solved={opponentSolved}
            />
          </div>
        )}

        {/* Resoluciones */}
        {isCompleted ? (
          <div className="space-y-4">
            <SolutionBlock
              label={challenge.senderId === studentId ? "Tu resolución" : `Resolución de ${challenge.senderName || challenge.senderId}`}
              solution={senderSolution}
            />
            <SolutionBlock
              label={challenge.recipientId === studentId ? "Tu resolución" : `Resolución de ${challenge.recipientName || challenge.recipientId}`}
              solution={recipientSolution}
            />
          </div>
        ) : (
          <>
            {currentStudentSolution && (
              <SolutionBlock label="Tu resolución" solution={currentStudentSolution} />
            )}
            {!currentStudentSolved && (
              <button
                onClick={() => router.push(`/solve/${challenge.exerciseId}?challenge=${challenge._id}`)}
                className="w-full bg-primary text-primary-foreground py-3 px-6 rounded-lg hover:opacity-90 transition-opacity"
              >
                Resolver desafío
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SolutionBlock({
  label,
  solution,
}: {
  label: string;
  solution?: ChallengeSolution;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="font-medium">{label}</p>
        {typeof solution?.evaluation?.score === "number" && (
          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
            {solution.evaluation.score}/100
          </span>
        )}
      </div>

      {solution?.solutionText ? (
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Tu respuesta:</p>
          <MathText
            content={solution.solutionText.replace(/\\n/g, "\n")}
            className="text-sm space-y-0.5"
          />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground mb-4">Sin respuesta cargada</p>
      )}

      {(solution?.evaluation?.feedback || (solution?.evaluation?.corrections?.length ?? 0) > 0) && (
        <div className="border-t border-border pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Análisis:</p>
          {solution?.evaluation?.feedback && (
            <MathText content={solution.evaluation.feedback} className="text-sm text-muted-foreground mb-2" />
          )}
          {solution?.evaluation?.corrections && solution.evaluation.corrections.length > 0 && (
            <ul className="space-y-1">
              {solution.evaluation.corrections.map((correction, idx) => (
                <li key={idx} className="text-sm flex gap-2">
                  <span className="text-primary font-medium flex-shrink-0">{idx + 1}.</span>
                  <MathText content={correction} />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function ParticipantStatus({ label, solved }: { label: string; solved: boolean }) {
  return (
    <div className="bg-muted/50 border border-border rounded-lg p-4">
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <p className={solved ? "text-green-700 font-medium" : "text-yellow-700 font-medium"}>
        {solved ? "Resuelto" : "Pendiente"}
      </p>
    </div>
  );
}

function getStatusText(status: string) {
  switch (status) {
    case "completed": return "Terminado";
    case "in-progress": return "En curso";
    default: return "Pendiente";
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "completed": return "text-green-700 bg-green-50";
    case "in-progress": return "text-yellow-700 bg-yellow-50";
    default: return "text-muted-foreground bg-muted";
  }
}
