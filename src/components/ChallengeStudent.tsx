"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Copy, Loader2, User, X } from "lucide-react";
import { Exercise } from "../data/exercises";
import { getOrCreateStudentId, getStudentName } from "../lib/studentIdentity";
import { MathText } from "./MathText";

interface StudentResult {
  publicStudentId: string;
  nombre: string;
}

export function ChallengeStudent({ id }: { id: string }) {
  const router = useRouter();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [myStudentId, setMyStudentId] = useState("");
  const [recipientStudentId, setRecipientStudentId] = useState("");
  const [message, setMessage] = useState("Te desafío a resolver este ejercicio y comparar procedimientos.");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<StudentResult[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [myName, setMyName] = useState("");

  useEffect(() => {
    setMyStudentId(getOrCreateStudentId());
    setMyName(getStudentName());

    fetch(`/api/exercises/${id}`)
      .then(async (res) => {
        if (!res.ok) { setNotFound(true); return; }
        const data = await res.json();
        setExercise(data);
      })
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false));
  }, [id]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (searchQuery.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ nombre: searchQuery });
        if (myStudentId) params.set("exclude", myStudentId);
        const res = await fetch(`/api/students?${params}`);
        const data = await res.json();
        setSearchResults(Array.isArray(data) ? data : []);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, myStudentId]);

  const handleSelectStudent = (student: StudentResult) => {
    setSelectedStudent(student);
    setRecipientStudentId(student.publicStudentId);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleClearStudent = () => {
    setSelectedStudent(null);
    setRecipientStudentId("");
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleSendChallenge = async () => {
    const cleanRecipientId = recipientStudentId.trim().toUpperCase();

    if (!cleanRecipientId || cleanRecipientId === myStudentId) return;

    setIsSending(true);
    setError("");

    try {
      const response = await fetch("/api/challenges", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          exerciseId: id,
          exerciseStatement: exercise?.statement,
          exerciseTopic: exercise?.topic,
          senderId: myStudentId,
          senderName: myName,
          recipientId: cleanRecipientId,
          recipientName: selectedStudent?.nombre || "",
          message,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "No se pudo enviar el desafío.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo enviar el desafío.";
      setError(message);
      setIsSending(false);
      return;
    }

    setIsSending(false);
    setShowConfirmation(true);
  };

  const handleCopyMyId = async () => {
    if (!myStudentId) return;

    await navigator.clipboard.writeText(myStudentId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Ejercicio no encontrado</p>
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

  if (showConfirmation) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto p-6">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="bg-green-50 border border-green-200 rounded-full p-6 mb-6">
              <Check className="size-16 text-green-600" />
            </div>

            <h2 className="mb-3">Desafío enviado correctamente</h2>

            <p className="text-muted-foreground text-center mb-6">
              El desafío quedó preparado para <strong>{selectedStudent?.nombre ?? recipientStudentId.trim().toUpperCase()}</strong>.
            </p>

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

        <h1 className="mb-4">Desafiar a un compañero</h1>

        <p className="text-muted-foreground mb-8">
          Compartí tu ID con tus compañeros y cargá el ID de la persona a la que querés desafiar.
        </p>

        {/* ID propio */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <p className="text-sm text-muted-foreground mb-2">Tu ID de estudiante</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1 bg-muted/50 border border-border rounded-lg px-4 py-3">
              <p className="text-lg tracking-wide">{myStudentId}</p>
            </div>
            <button
              onClick={handleCopyMyId}
              className="border border-border py-3 px-4 rounded-lg hover:bg-muted transition-colors flex items-center justify-center gap-2"
            >
              {copied ? <Check className="size-5 text-green-600" /> : <Copy className="size-5" />}
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>
        </div>

        {/* Ejercicio seleccionado */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <p className="text-sm text-muted-foreground mb-3">Ejercicio seleccionado</p>

          <MathText content={exercise.statement} className="text-lg mb-4" />

          <div className="flex gap-3">
            <span className="bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm">
              Tema: {exercise.topic}
            </span>
            <span className={`px-3 py-1.5 rounded-full text-sm ${getDifficultyColor(exercise.difficulty)}`}>
              Dificultad: {exercise.difficulty}
            </span>
          </div>
        </div>

        {/* Destinatario */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <label className="block mb-3">
            <span className="font-medium flex items-center gap-2">
              <User className="size-5 text-primary" />
              Buscar compañero
            </span>
          </label>

          {selectedStudent ? (
            <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-lg px-4 py-3 mt-4">
              <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">
                {selectedStudent.nombre.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{selectedStudent.nombre}</p>
                <p className="text-xs text-muted-foreground">{selectedStudent.publicStudentId}</p>
              </div>
              <button
                onClick={handleClearStudent}
                className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Escribí el nombre del compañero..."
                className="w-full bg-background border border-border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground" />
              )}
              {(searchResults.length > 0 || (searchQuery.length >= 2 && !isSearching)) && (
                <div className="mt-4 border border-border rounded-lg overflow-hidden shadow-sm">
                  {searchResults.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-muted-foreground">Sin resultados</p>
                  ) : (
                    searchResults.map((student) => (
                      <button
                        key={student.publicStudentId}
                        onClick={() => handleSelectStudent(student)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left border-b border-border last:border-0"
                      >
                        <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">
                          {student.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{student.nombre}</p>
                          <p className="text-xs text-muted-foreground">{student.publicStudentId}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mensaje para el desafío */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <label className="block mb-3">
            <span className="font-medium">Mensaje para el desafío (opcional)</span>
          </label>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Te desafío a resolver este ejercicio y comparar procedimientos."
            className="w-full min-h-[120px] bg-background border border-border rounded-lg p-4 resize-y focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Botón enviar */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <button
          onClick={handleSendChallenge}
          disabled={isSending || !selectedStudent}
          className="w-full bg-primary text-primary-foreground py-4 px-6 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSending ? "Enviando desafío..." : "Enviar desafío"}
        </button>
      </div>
    </div>
  );
}
