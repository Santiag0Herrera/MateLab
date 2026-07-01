"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpenCheck,
  CalendarClock,
  Check,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { getStudentSession } from "../lib/studentIdentity";
import { AVAILABLE_TOPICS } from "../data/exercises";

interface TopicForm {
  id: number;
  name: string;
  minimumExercises: number;
  weight: number;
}

interface ExamRecord {
  id: string;
  name: string;
  passingScore: number;
  topics: Array<{
    name: string;
    minimumExercises: number;
    weight: number;
  }>;
  recency: {
    enabled: boolean;
    recentWindowDays: number | null;
    recentAttemptWeight: number;
    olderAttemptWeight: number;
  };
}

interface SubjectRecord {
  id: string;
  name: string;
  exams: ExamRecord[];
}

let nextTopicId = 2;

export function ExamConfiguration() {
  const router = useRouter();
  const [subjectName, setSubjectName] = useState("");
  const [examName, setExamName] = useState("");
  const [passingScore, setPassingScore] = useState(60);
  const [topics, setTopics] = useState<TopicForm[]>([
    { id: 1, name: "", minimumExercises: 3, weight: 100 },
  ]);
  const [recencyEnabled, setRecencyEnabled] = useState(false);
  const [recentWindowDays, setRecentWindowDays] = useState(30);
  const [recentAttemptWeight, setRecentAttemptWeight] = useState(2);
  const [olderAttemptWeight, setOlderAttemptWeight] = useState(1);
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const totalWeight = useMemo(
    () => topics.reduce((total, topic) => total + Number(topic.weight || 0), 0),
    [topics]
  );

  const loadSubjects = useCallback(async () => {
    const studentId = getStudentSession()?.publicStudentId;

    if (!studentId) {
      setError("No se encontró el estudiante de la sesión.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/subjects?studentId=${encodeURIComponent(studentId)}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "No se pudieron cargar las materias.");
      setSubjects(Array.isArray(payload) ? payload : []);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "No se pudieron cargar las materias."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  const updateTopic = (
    id: number,
    field: "name" | "minimumExercises" | "weight",
    value: string
  ) => {
    setTopics((current) =>
      current.map((topic) =>
        topic.id === id
          ? {
              ...topic,
              [field]: field === "name" ? value : Number(value),
            }
          : topic
      )
    );
  };

  const addTopic = () => {
    const remainingWeight = Math.max(0, 100 - totalWeight);
    setTopics((current) => [
      ...current,
      {
        id: nextTopicId++,
        name: "",
        minimumExercises: 3,
        weight: remainingWeight,
      },
    ]);
  };

  const removeTopic = (id: number) => {
    setTopics((current) => current.filter((topic) => topic.id !== id));
  };

  const resetForm = () => {
    setSubjectName("");
    setExamName("");
    setPassingScore(60);
    setTopics([{ id: nextTopicId++, name: "", minimumExercises: 3, weight: 100 }]);
    setRecencyEnabled(false);
    setRecentWindowDays(30);
    setRecentAttemptWeight(2);
    setOlderAttemptWeight(1);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (Math.abs(totalWeight - 100) > 0.01) {
      setError("Los pesos de los temas deben sumar exactamente 100%.");
      return;
    }

    setIsSaving(true);
    const session = getStudentSession();

    try {
      const response = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectName,
          examName,
          passingScore,
          topics: topics.map(({ name, minimumExercises, weight }) => ({
            name,
            minimumExercises,
            weight,
          })),
          recency: {
            enabled: recencyEnabled,
            recentWindowDays,
            recentAttemptWeight,
            olderAttemptWeight,
          },
          createdBy: session?.publicStudentId,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "No se pudo guardar el examen.");
      }

      setSuccess(`Se guardó ${payload.exam.name} en la materia ${payload.subject}.`);
      resetForm();
      await loadSubjects();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudo guardar el examen.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto p-6">
        <button
          onClick={() => router.push("/preparation")}
          className="flex items-center gap-2 mb-6 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-5" />
          Volver a preparación
        </button>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BookOpenCheck className="size-8 text-primary" />
            <h1>Configurar materias y exámenes</h1>
          </div>
          <p className="text-muted-foreground">
            Definí qué evidencia se necesita para calcular la preparación de un estudiante.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            <Field label="Materia">
              <input
                value={subjectName}
                onChange={(event) => setSubjectName(event.target.value)}
                placeholder="Ej. Análisis Matemático I"
                required
                className="w-full bg-input-background border border-border rounded-lg p-3"
              />
            </Field>
            <Field label="Examen">
              <input
                value={examName}
                onChange={(event) => setExamName(event.target.value)}
                placeholder="Ej. Primer parcial"
                required
                className="w-full bg-input-background border border-border rounded-lg p-3"
              />
            </Field>
            <Field label="Puntaje considerado aprobado">
              <div className="relative">
                <input
                  type="number"
                  value={passingScore}
                  onChange={(event) => setPassingScore(Number(event.target.value))}
                  min={0}
                  max={100}
                  required
                  className="w-full bg-input-background border border-border rounded-lg p-3 pr-10"
                />
                <span className="absolute right-3 top-3 text-muted-foreground">%</span>
              </div>
            </Field>
          </div>

          <div className="border-t border-border pt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                <h2>Temas incluidos</h2>
                <p className="text-sm text-muted-foreground">
                  El peso determina cuánto aporta cada tema a la preparación total.
                </p>
              </div>
              <div
                className={`px-3 py-2 rounded-lg text-sm ${
                  Math.abs(totalWeight - 100) <= 0.01
                    ? "bg-green-50 text-green-700"
                    : "bg-yellow-50 text-yellow-800"
                }`}
              >
                Peso total: {totalWeight}%
              </div>
            </div>

            <div className="space-y-4">
              {topics.map((topic, index) => (
                <div
                  key={topic.id}
                  className="grid grid-cols-1 md:grid-cols-[1fr_190px_140px_auto] gap-3 items-end bg-muted/40 border border-border rounded-xl p-4"
                >
                  <Field label={`Tema ${index + 1}`}>
                    <select
                      value={topic.name}
                      onChange={(event) => updateTopic(topic.id, "name", event.target.value)}
                      required
                      className="w-full bg-background border border-border rounded-lg p-3"
                    >
                      <option value="" disabled>
                        Seleccioná un tema
                      </option>
                      {AVAILABLE_TOPICS.map((availableTopic) => (
                        <option key={availableTopic} value={availableTopic}>
                          {availableTopic}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Mínimo de ejercicios">
                    <input
                      type="number"
                      value={topic.minimumExercises}
                      onChange={(event) =>
                        updateTopic(topic.id, "minimumExercises", event.target.value)
                      }
                      min={1}
                      required
                      className="w-full bg-background border border-border rounded-lg p-3"
                    />
                  </Field>
                  <Field label="Peso">
                    <div className="relative">
                      <input
                        type="number"
                        value={topic.weight}
                        onChange={(event) => updateTopic(topic.id, "weight", event.target.value)}
                        min={1}
                        max={100}
                        step="0.01"
                        required
                        className="w-full bg-background border border-border rounded-lg p-3 pr-9"
                      />
                      <span className="absolute right-3 top-3 text-muted-foreground">%</span>
                    </div>
                  </Field>
                  <button
                    type="button"
                    onClick={() => removeTopic(topic.id)}
                    disabled={topics.length === 1}
                    aria-label={`Eliminar tema ${index + 1}`}
                    className="h-[50px] px-4 border border-border rounded-lg hover:bg-background text-muted-foreground hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="size-5" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addTopic}
              className="mt-4 border border-border py-2 px-4 rounded-lg hover:bg-muted transition-colors flex items-center gap-2"
            >
              <Plus className="size-4" />
              Agregar tema
            </button>
          </div>

          <div className="border-t border-border mt-6 pt-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={recencyEnabled}
                onChange={(event) => setRecencyEnabled(event.target.checked)}
                className="mt-1 size-4 accent-primary"
              />
              <span>
                <span className="flex items-center gap-2">
                  <CalendarClock className="size-5 text-primary" />
                  Dar más importancia a los intentos recientes
                </span>
                <span className="block text-sm text-muted-foreground mt-1 font-normal">
                  Útil para representar mejor el nivel actual y no tanto resultados antiguos.
                </span>
              </span>
            </label>

            {recencyEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5 bg-muted/40 border border-border rounded-xl p-4">
                <Field label="Período reciente (días)">
                  <input
                    type="number"
                    value={recentWindowDays}
                    onChange={(event) => setRecentWindowDays(Number(event.target.value))}
                    min={1}
                    required
                    className="w-full bg-background border border-border rounded-lg p-3"
                  />
                </Field>
                <Field label="Peso intento reciente">
                  <input
                    type="number"
                    value={recentAttemptWeight}
                    onChange={(event) => setRecentAttemptWeight(Number(event.target.value))}
                    min={0.1}
                    step={0.1}
                    required
                    className="w-full bg-background border border-border rounded-lg p-3"
                  />
                </Field>
                <Field label="Peso intento anterior">
                  <input
                    type="number"
                    value={olderAttemptWeight}
                    onChange={(event) => setOlderAttemptWeight(Number(event.target.value))}
                    min={0.1}
                    step={0.1}
                    required
                    className="w-full bg-background border border-border rounded-lg p-3"
                  />
                </Field>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6 flex items-center gap-2">
              <Check className="size-5 text-green-700" />
              <p className="text-green-700">{success}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSaving || Math.abs(totalWeight - 100) > 0.01}
            className="w-full mt-6 bg-primary text-primary-foreground py-3 px-6 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSaving && <Loader2 className="size-4 animate-spin" />}
            {isSaving ? "Guardando..." : "Guardar configuración"}
          </button>
        </form>

        <section>
          <h2 className="mb-4">Tus configuraciones guardadas</h2>
          {isLoading ? (
            <div className="bg-card border border-border rounded-xl p-6 text-muted-foreground">
              Cargando materias...
            </div>
          ) : subjects.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-6 text-muted-foreground">
              Todavía no hay materias configuradas.
            </div>
          ) : (
            <div className="space-y-5">
              {subjects.map((subject) => (
                <div key={subject.id} className="bg-card border border-border rounded-xl p-5">
                  <h3 className="mb-4">{subject.name}</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {subject.exams.map((exam) => (
                      <ExamCard key={exam.id} exam={exam} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block mb-2 text-sm">{label}</span>
      {children}
    </label>
  );
}

function ExamCard({ exam }: { exam: ExamRecord }) {
  return (
    <article className="border border-border rounded-xl p-4">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h4>{exam.name}</h4>
          <p className="text-sm text-muted-foreground">Aprobación: {exam.passingScore}%</p>
        </div>
        <span className="bg-primary/10 text-primary rounded-full px-3 py-1 text-sm">
          {exam.topics.length} {exam.topics.length === 1 ? "tema" : "temas"}
        </span>
      </div>
      <div className="space-y-2">
        {exam.topics.map((topic) => (
          <div key={topic.name} className="bg-muted/50 rounded-lg p-3">
            <div className="flex justify-between gap-3">
              <span>{topic.name}</span>
              <span className="text-primary">{topic.weight}%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Mínimo: {topic.minimumExercises} ejercicios
            </p>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-4">
        {exam.recency.enabled
          ? `Los intentos de los últimos ${exam.recency.recentWindowDays} días pesan ${exam.recency.recentAttemptWeight}× frente a ${exam.recency.olderAttemptWeight}× para los anteriores.`
          : "Todos los intentos tienen la misma importancia."}
      </p>
    </article>
  );
}
