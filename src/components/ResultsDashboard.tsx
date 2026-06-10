"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trophy, UserRound } from "lucide-react";
import { getOrCreateStudentId } from "../lib/studentIdentity";

interface Solution {
  _id: string;
  exerciseId: string;
  exerciseStatement: string;
  exerciseTopic: string;
  studentId: string;
  solutionText: string;
  evaluation?: {
    score?: number;
    feedback?: string;
    corrections?: string[];
  };
  createdAt: string;
}

interface ChallengeResult {
  challenge: {
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
    createdAt: string;
  };
  solutions: Solution[];
}

export function ResultsDashboard() {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [mySolutions, setMySolutions] = useState<Solution[]>([]);
  const [challengeResults, setChallengeResults] = useState<ChallengeResult[]>([]);
  const [activeTab, setActiveTab] = useState<"solutions" | "challenges">("solutions");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const id = getOrCreateStudentId();
    setStudentId(id);

    fetch(`/api/results?studentId=${encodeURIComponent(id)}`)
      .then(async (response) => {
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "No se pudieron cargar los resultados.");
        }

        setMySolutions(payload.mySolutions || []);
        setChallengeResults(payload.challengeResults || []);
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : "No se pudieron cargar los resultados.";
        setError(message);
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6">
        <button
          onClick={() => router.push("/exercises")}
          className="flex items-center gap-2 mb-6 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-5" />
          Volver a ejercicios
        </button>

        <div className="mb-8">
          <h1 className="mb-2">Resultados</h1>
          <p className="text-muted-foreground">
            Historial para <span className="text-foreground">{studentId}</span>
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-2 mb-6 inline-flex gap-2">
          <button
            onClick={() => setActiveTab("solutions")}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              activeTab === "solutions" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            <UserRound className="size-4" />
            Mis resoluciones ({mySolutions.length})
          </button>
          <button
            onClick={() => setActiveTab("challenges")}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              activeTab === "challenges" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            <Trophy className="size-4" />
            Desafíos ({challengeResults.length})
          </button>
        </div>

        {isLoading && (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <p className="text-muted-foreground">Cargando resultados...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {!isLoading && !error && activeTab === "solutions" && (
          <SolutionsList solutions={mySolutions} />
        )}

        {!isLoading && !error && activeTab === "challenges" && (
          <ChallengeResults challengeResults={challengeResults} currentStudentId={studentId} />
        )}
      </div>
    </div>
  );
}

function SolutionsList({ solutions }: { solutions: Solution[] }) {
  if (solutions.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center">
        <p className="text-muted-foreground">Todavía no guardaste resoluciones.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {solutions.map((solution) => (
        <SolutionCard key={solution._id} solution={solution} />
      ))}
    </div>
  );
}

function ChallengeResults({
  challengeResults,
  currentStudentId,
}: {
  challengeResults: ChallengeResult[];
  currentStudentId: string;
}) {
  if (challengeResults.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center">
        <p className="text-muted-foreground">Todavía no participaste en desafíos con resultados.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {challengeResults.map(({ challenge, solutions }) => (
        <div key={challenge._id} className="bg-card border border-border rounded-xl p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between mb-4">
            <div>
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                {challenge.exerciseTopic || "Ejercicio"}
              </span>
              <p className="mt-3">{challenge.exerciseStatement}</p>
            </div>
            <div className="text-sm text-muted-foreground">
              {new Date(challenge.createdAt).toLocaleDateString()}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <ParticipantScore
              label={challenge.senderId === currentStudentId ? "Vos desafiaste" : "Te desafió"}
              studentId={challenge.senderId}
              studentName={challenge.senderName}
              solution={solutions.find((solution) => solution.studentId === challenge.senderId)}
            />
            <ParticipantScore
              label={challenge.recipientId === currentStudentId ? "Tu resultado" : "Compañero desafiado"}
              studentId={challenge.recipientId}
              studentName={challenge.recipientName}
              solution={solutions.find((solution) => solution.studentId === challenge.recipientId)}
            />
          </div>

          {challenge.status === "completed" && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-green-900 font-medium">
                {challenge.isTie
                  ? "El desafío terminó empatado"
                  : (() => {
                      if (challenge.winnerId === currentStudentId) return "Ganador: Vos";
                      const winnerName =
                        challenge.winnerId === challenge.senderId
                          ? challenge.senderName || challenge.senderId
                          : challenge.winnerId === challenge.recipientId
                            ? challenge.recipientName || challenge.recipientId
                            : challenge.winnerId;
                      return `Ganador: ${winnerName}`;
                    })()}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <AnswerBlock
              title={challenge.senderId === currentStudentId ? "Tu respuesta" : "Respuesta del desafiante"}
              solution={solutions.find((solution) => solution.studentId === challenge.senderId)}
            />
            <AnswerBlock
              title={challenge.recipientId === currentStudentId ? "Tu respuesta" : "Respuesta del compañero"}
              solution={solutions.find((solution) => solution.studentId === challenge.recipientId)}
            />
          </div>

          {challenge.message && (
            <p className="text-sm text-muted-foreground mt-4">{challenge.message}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function AnswerBlock({ title, solution }: { title: string; solution?: Solution }) {
  return (
    <div className="bg-muted/50 border border-border rounded-lg p-4">
      <p className="text-sm text-muted-foreground mb-2">{title}</p>
      <p className="whitespace-pre-line text-sm">
        {solution?.solutionText || "Pendiente de resolución"}
      </p>
    </div>
  );
}

function ParticipantScore({
  label,
  studentId,
  studentName,
  solution,
}: {
  label: string;
  studentId: string;
  studentName?: string;
  solution?: Solution;
}) {
  return (
    <div className="bg-muted/50 border border-border rounded-lg p-4">
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <p className="font-medium">{studentName || studentId}</p>
      {studentName && <p className="text-xs text-muted-foreground mb-3">{studentId}</p>}
      {!studentName && <div className="mb-3" />}
      {solution ? (
        <>
          <p className="text-2xl font-medium mb-2">
            {typeof solution.evaluation?.score === "number"
              ? `${solution.evaluation.score}/100`
              : "Sin puntaje"}
          </p>
          {solution.evaluation?.feedback && (
            <p className="text-sm text-muted-foreground">{solution.evaluation.feedback}</p>
          )}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Pendiente de resolución</p>
      )}
    </div>
  );
}

function SolutionCard({ solution }: { solution: Solution }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
          {solution.exerciseTopic || "Ejercicio"}
        </span>
        <span className="text-sm text-muted-foreground">
          {new Date(solution.createdAt).toLocaleDateString()}
        </span>
      </div>

      <p className="mb-4">{solution.exerciseStatement}</p>

      <div className="bg-muted/50 border border-border rounded-lg p-4 mb-4">
        <p className="text-sm text-muted-foreground mb-2">Tu resolución</p>
        <p className="line-clamp-4">{solution.solutionText}</p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Puntaje</p>
          <p className="text-2xl font-medium">
            {typeof solution.evaluation?.score === "number"
              ? `${solution.evaluation.score}/100`
              : "Sin puntaje"}
          </p>
        </div>
      </div>

      {solution.evaluation?.feedback && (
        <p className="text-sm text-muted-foreground mt-4">{solution.evaluation.feedback}</p>
      )}
    </div>
  );
}
