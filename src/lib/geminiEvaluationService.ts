import { GoogleGenerativeAI } from "@google/generative-ai";

interface EvaluationInput {
  exerciseId: string | null;
  topic: string | null;
  statement: string;
  image: File;
}

interface EvaluationResult {
  score?: number;
  feedback?: string;
  corrections?: string[];
  solutionText?: string;
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

function buildPrompt(statement: string, topic: string | null): string {
  return `
Sos un corrector de ejercicios de matemática universitaria.
Se te proporciona el enunciado del ejercicio y una imagen con la resolución manuscrita del estudiante.

${topic ? `Tema: ${topic}\n` : ""}Enunciado: ${statement}

Tu tarea:
1. Resolvé el ejercicio por tu cuenta para obtener la solución correcta.
2. Comparala paso a paso con la resolución del estudiante que aparece en la imagen.
3. Identificá cada línea o paso escrito por el estudiante y comentá si es correcto o incorrecto.

Devolvé ÚNICAMENTE un objeto JSON válido con la siguiente estructura, sin texto adicional ni bloques de código:
{
  "score": <número entero de 0 a 100>,
  "feedback": "<comentario general sobre la resolución>",
  "corrections": [
    "<línea 1 del estudiante: comentario>",
    "<línea 2 del estudiante: comentario>",
    ...
  ],
  "solutionText": "<transcripción fiel y ordenada de todo lo que escribió el estudiante en la imagen>"
}

Reglas:
- "score" debe reflejar qué tan correcta y completa es la resolución.
- "feedback" debe ser un párrafo breve con la impresión general.
- Cada elemento de "corrections" debe referenciar un paso o línea concreta de la imagen y explicar si está bien o mal, y por qué.
- Si un paso es correcto, indicalo. Si es incorrecto, explicá cuál debería ser el resultado correcto.
- "solutionText" debe ser una transcripción literal y ordenada de todo lo que escribió el estudiante, sin agregar ni omitir pasos. Usá el carácter \n para separar cada paso o línea del manuscrito, respetando la estructura visual del original.
- Cuando en "feedback", "corrections" o "solutionText" aparezca una expresión matemática (potencias, raíces, fracciones, integrales, límites, etc.), escribila en formato LaTeX delimitado por $...$ para expresiones inline o $$...$$ para bloques, por ejemplo "$x^2 + \\sqrt{y}$" en vez de "x^2 + sqrt(y)". El resto del texto debe seguir en español plano.
- No incluyas nada fuera del JSON.
`.trim();
}

function parseEvaluationResult(raw: string): EvaluationResult {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();

  const parsed = JSON.parse(cleaned);

  return {
    score: typeof parsed.score === "number" ? parsed.score : undefined,
    feedback: typeof parsed.feedback === "string" ? parsed.feedback : undefined,
    corrections: Array.isArray(parsed.corrections)
      ? parsed.corrections.map(String)
      : undefined,
    solutionText: typeof parsed.solutionText === "string" ? parsed.solutionText : undefined,
  };
}

export async function evaluateExerciseWithGemini(
  input: EvaluationInput
): Promise<EvaluationResult> {
  const arrayBuffer = await input.image.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  const result = await model.generateContent([
    {
      inlineData: {
        data: base64,
        mimeType: input.image.type || "image/jpeg",
      },
    },
    buildPrompt(input.statement, input.topic),
  ]);

  const rawText = result.response.text();
  console.log("[gemini] Respuesta raw:", rawText);
  return parseEvaluationResult(rawText);
}
