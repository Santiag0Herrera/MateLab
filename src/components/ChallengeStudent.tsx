"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Copy, User } from "lucide-react";
import { Exercise, initialExercises } from "../data/exercises";
import { getOrCreateStudentId } from "../lib/studentIdentity";

export function ChallengeStudent({ id }: { id: string }) {
  const router = useRouter();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [myStudentId, setMyStudentId] = useState("");
  const [recipientStudentId, setRecipientStudentId] = useState("");
  const [message, setMessage] = useState("Te desafío a resolver este ejercicio y comparar procedimientos.");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("matelab-exercises");
    const exercises = stored ? JSON.parse(stored) : initialExercises;
    const found = exercises.find((ex: Exercise) => ex.id === id);
    setExercise(found || null);
    setMyStudentId(getOrCreateStudentId());
  }, [id]);

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
          recipientId: cleanRecipientId,
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

  if (!exercise) {
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
              El desafío quedó preparado para el estudiante con ID <strong>{recipientStudentId.trim().toUpperCase()}</strong>.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6 max-w-2xl">
              <p className="text-blue-900 text-center text-sm">
                Esta pantalla guarda el desafío en este navegador como demo. Para producción, el próximo paso es persistirlo en una base de datos compartida.
              </p>
            </div>

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

          <p className="text-lg mb-4">{exercise.statement}</p>

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
              ID del compañero
            </span>
          </label>

          <input
            value={recipientStudentId}
            onChange={(e) => setRecipientStudentId(e.target.value.toUpperCase())}
            placeholder="Ej: ML-1A2B3C4D"
            className="w-full bg-background border border-border rounded-lg p-3 tracking-wide focus:outline-none focus:ring-2 focus:ring-primary"
          />

          {recipientStudentId.trim().toUpperCase() === myStudentId && (
            <p className="text-red-600 text-sm mt-3">
              No podés enviarte un desafío a tu propio ID.
            </p>
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
          disabled={
            isSending ||
            !recipientStudentId.trim() ||
            recipientStudentId.trim().toUpperCase() === myStudentId
          }
          className="w-full bg-primary text-primary-foreground py-4 px-6 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSending ? "Enviando desafío..." : "Enviar desafío"}
        </button>
      </div>
    </div>
  );
}
