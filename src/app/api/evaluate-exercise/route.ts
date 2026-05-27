import { NextResponse } from "next/server";

interface EvaluationRequest {
  exerciseId?: string;
  topic?: string;
  statement?: string;
  studentSolution?: string;
  imageAttached?: boolean;
}

const fallbackEvaluation = {
  score: 70,
  feedback:
    "La resolucion fue guardada. Esta es una evaluacion local de ejemplo porque el webhook de n8n no esta configurado.",
  corrections: [
    "Revisa que cada paso algebraico este justificado.",
    "Inclui el resultado final con unidades o notacion completa si corresponde.",
  ],
  isFallback: true,
};

function asArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String);
  }

  if (typeof value === "string" && value.trim()) {
    return [value];
  }

  return [];
}

function firstNonEmpty(...values: string[][]): string[] {
  return values.find((value) => value.length > 0) ?? [];
}

function parseJsonText(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "string") {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function normalizeEvaluation(payload: unknown): Record<string, unknown> {
  const firstItem = Array.isArray(payload) ? payload[0] : payload;

  if (!firstItem || typeof firstItem !== "object") {
    return {};
  }

  const item = firstItem as Record<string, unknown>;
  const directText =
    item.text ??
    item.output ??
    item.content ??
    item.response;

  const parsedDirectText = parseJsonText(directText);
  if (parsedDirectText) {
    return parsedDirectText;
  }

  const candidates = item.candidates;
  if (Array.isArray(candidates)) {
    const candidate = candidates[0] as Record<string, unknown> | undefined;
    const content = candidate?.content as Record<string, unknown> | undefined;
    const parts = content?.parts;

    if (Array.isArray(parts)) {
      const part = parts[0] as Record<string, unknown> | undefined;
      const parsedPartText = parseJsonText(part?.text);

      if (parsedPartText) {
        return parsedPartText;
      }
    }
  }

  return item;
}

export async function POST(request: Request) {
  let body: EvaluationRequest;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "El cuerpo de la solicitud debe ser JSON valido." },
      { status: 400 }
    );
  }

  if (!body.statement || !body.studentSolution) {
    return NextResponse.json(
      { error: "Faltan el enunciado o la resolucion del estudiante." },
      { status: 400 }
    );
  }

  const webhookUrl = process.env.N8N_WEBHOOK_URL;

  if (!webhookUrl) {
    return NextResponse.json({ evaluation: fallbackEvaluation });
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.N8N_WEBHOOK_TOKEN
          ? { Authorization: `Bearer ${process.env.N8N_WEBHOOK_TOKEN}` }
          : {}),
      },
      body: JSON.stringify({
        source: "matelab",
        exerciseId: body.exerciseId,
        topic: body.topic,
        statement: body.statement,
        studentSolution: body.studentSolution,
        imageAttached: body.imageAttached,
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "El flujo de n8n no pudo evaluar la resolucion." },
        { status: 502 }
      );
    }

    const n8nPayload = await response.json();
    const evaluation = normalizeEvaluation(n8nPayload);

    return NextResponse.json({
      evaluation: {
        score: evaluation.score ?? evaluation.puntuation ?? evaluation.puntaje,
        feedback: evaluation.feedback ?? evaluation.summary ?? evaluation.comentario,
        corrections: firstNonEmpty(
          asArray(evaluation.corrections),
          asArray(evaluation.correcciones),
          asArray(evaluation.errors)
        ),
        raw: n8nPayload,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "No se pudo conectar con el webhook de n8n." },
      { status: 502 }
    );
  }
}
