import { NextResponse } from "next/server";
import { evaluateExerciseWithGemini } from "../../../lib/geminiEvaluationService";

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


export async function POST(request: Request) {
  const form = await request.formData();
  const statement = form.get("statement") as string | null;
  const exerciseId = form.get("exerciseId") as string | null;
  const topic = form.get("topic") as string | null;
  const image = form.get("image") as File | null;

  if (!statement || !image || image.size === 0) {
    return NextResponse.json(
      { error: "Falta el enunciado o no se adjuntó ninguna imagen." },
      { status: 400 }
    );
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ evaluation: fallbackEvaluation });
  }

  try {
    const evaluation = await evaluateExerciseWithGemini({
      exerciseId,
      topic,
      statement,
      image,
    });

    return NextResponse.json({ evaluation });
  } catch (err) {
    console.error("[evaluate-exercise] Error al llamar a Gemini:", err);
    return NextResponse.json(
      { error: "No se pudo evaluar la resolución con Gemini." },
      { status: 502 }
    );
  }
}
