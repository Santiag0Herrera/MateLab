"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpenCheck,
  CheckCircle2,
  CircleAlert,
  Loader2,
  Target,
} from "lucide-react";
import { getStudentSession } from "../lib/studentIdentity";

interface TopicProgress {
  name: string;
  weight: number;
  minimumExercises: number;
  completedExercises: number;
  missingExercises: number;
  averageScore: number;
  coveragePercentage: number;
  preparationPercentage: number;
}

interface ExamRecord {
  id: string;
  name: string;
  passingScore: number;
  preparation: {
    preparationPercentage: number;
    minimumsCompleted: boolean;
    ready: boolean;
    completedExercises: number;
    requiredExercises: number;
    topics: TopicProgress[];
  };
}

interface SubjectRecord {
  id: string;
  name: string;
  exams: ExamRecord[];
}

export function ExamPreparation() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const studentId = getStudentSession()?.publicStudentId;

    if (!studentId) {
      setError("No se encontró el estudiante de la sesión.");
      setIsLoading(false);
      return;
    }

    fetch(`/api/subjects?studentId=${encodeURIComponent(studentId)}`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || "No se pudo calcular la preparación.");
        }
        setSubjects(Array.isArray(payload) ? payload : []);
      })
      .catch((loadError) => {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudo calcular la preparación."
        );
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

        <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Target className="size-8 text-primary" />
              <h1>Mi preparación para exámenes</h1>
            </div>
            <p className="text-muted-foreground">
              El porcentaje combina tus puntajes, los ejercicios mínimos y el peso de cada tema.
            </p>
          </div>
          <button
            onClick={() => router.push("/exam-setup")}
            className="border border-border px-6 py-3 rounded-lg hover:bg-muted transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <BookOpenCheck className="size-5" />
            Configurar examen
          </button>
        </div>

        {isLoading && (
          <div className="bg-card border border-border rounded-xl p-10 flex justify-center">
            <Loader2 className="size-7 animate-spin text-primary" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-700">
            {error}
          </div>
        )}

        {!isLoading && !error && subjects.length === 0 && (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <BookOpenCheck className="size-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">
              Todavía no hay materias y exámenes configurados.
            </p>
          </div>
        )}

        {!isLoading && !error && subjects.length > 0 && (
          <div className="space-y-6">
            {subjects.map((subject) => (
              <section key={subject.id} className="bg-card border border-border rounded-xl p-5">
                <h2 className="mb-4">{subject.name}</h2>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  {subject.exams.map((exam) => (
                    <ExamProgressCard key={exam.id} exam={exam} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ExamProgressCard({ exam }: { exam: ExamRecord }) {
  const progress = exam.preparation;
  const percentage = progress.preparationPercentage;
  const status = getPreparationStatus(percentage, exam.passingScore, progress.ready);

  return (
    <article className="border border-border rounded-xl p-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
        <div>
          <h3>{exam.name}</h3>
          <p className="text-sm text-muted-foreground">
            Puntaje objetivo: {exam.passingScore}%
          </p>
        </div>
        <div className={`rounded-xl px-4 py-3 text-center ${status.colors}`}>
          <p className="text-3xl font-semibold leading-none">{percentage}%</p>
          <p className="text-xs mt-1">{status.label}</p>
        </div>
      </div>

      <div className="h-3 bg-muted rounded-full overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all ${status.bar}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      <div className="flex items-center gap-2 text-sm mb-5">
        {progress.ready ? (
          <CheckCircle2 className="size-4 text-green-600" />
        ) : (
          <CircleAlert className="size-4 text-yellow-600" />
        )}
        <span className="text-muted-foreground">
          {progress.completedExercises} de {progress.requiredExercises} ejercicios mínimos
          completados
        </span>
      </div>

      <div className="space-y-3">
        {progress.topics.map((topic) => (
          <div key={topic.name} className="bg-muted/50 border border-border rounded-lg p-3">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div>
                <p className="font-medium">{topic.name}</p>
                <p className="text-xs text-muted-foreground">
                  Peso {topic.weight}% · Promedio {topic.averageScore}%
                </p>
              </div>
              <span className="text-primary font-medium">
                {topic.preparationPercentage}%
              </span>
            </div>
            <div className="h-2 bg-background rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${Math.min(topic.preparationPercentage, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {topic.completedExercises}/{topic.minimumExercises} ejercicios
              {topic.missingExercises > 0
                ? ` · faltan ${topic.missingExercises}`
                : " · mínimo alcanzado"}
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}

function getPreparationStatus(percentage: number, passingScore: number, ready: boolean) {
  if (ready) {
    return {
      label: "Listo para rendir",
      colors: "bg-green-50 text-green-700",
      bar: "bg-green-600",
    };
  }
  if (percentage >= passingScore) {
    return {
      label: "Falta completar práctica",
      colors: "bg-yellow-50 text-yellow-800",
      bar: "bg-yellow-500",
    };
  }
  if (percentage >= passingScore * 0.65) {
    return {
      label: "En progreso",
      colors: "bg-blue-50 text-blue-700",
      bar: "bg-blue-500",
    };
  }
  return {
    label: "Necesita más práctica",
    colors: "bg-red-50 text-red-700",
    bar: "bg-red-500",
  };
}
