export type Difficulty = "Baja" | "Media" | "Alta" | "Pendiente de análisis";
export type Source = "Precargado" | "Subido por alumno" | "Generado por IA";

export interface Exercise {
  id: string;
  topic: string;
  source: Source;
  difficulty: Difficulty;
  statement: string;
  concepts?: string[];
}

export const initialExercises: Exercise[] = [
  {
    id: "1",
    topic: "Derivadas",
    source: "Precargado",
    difficulty: "Media",
    statement: "Derivar f(x) = x² · sen(x)",
    concepts: ["regla del producto", "derivadas trigonométricas"],
  },
  {
    id: "2",
    topic: "Límites",
    source: "Subido por alumno",
    difficulty: "Pendiente de análisis",
    statement: "Calcular el límite cuando x tiende a 0 de sen(x)/x",
  },
  {
    id: "3",
    topic: "Integrales",
    source: "Generado por IA",
    difficulty: "Baja",
    statement: "Resolver ∫ 2x dx",
  },
];
