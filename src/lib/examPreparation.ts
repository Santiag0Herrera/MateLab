export interface PreparationSolution {
  exerciseTopic?: string;
  evaluation?: { score?: number };
  createdAt?: Date | string;
}

export interface PreparationTopic {
  name: string;
  normalizedName?: string;
  minimumExercises: number;
  weight: number;
}

export interface PreparationExam {
  passingScore: number;
  topics: PreparationTopic[];
  recency?: {
    enabled?: boolean;
    recentWindowDays?: number | null;
    recentAttemptWeight?: number;
    olderAttemptWeight?: number;
  };
}

export function calculateExamPreparation(
  exam: PreparationExam,
  solutions: PreparationSolution[],
  now = new Date()
) {
  const topicProgress = exam.topics.map((topic) => {
    const topicSolutions = solutions.filter(
      (solution) => normalizeName(solution.exerciseTopic || "") === normalizeName(topic.name)
    );
    const scoredSolutions = topicSolutions.filter(
      (solution) => typeof solution.evaluation?.score === "number"
    );
    const weightedScore = calculateWeightedScore(exam, scoredSolutions, now);
    const completedExercises = scoredSolutions.length;
    const coverage = Math.min(completedExercises / topic.minimumExercises, 1);
    const preparation = round(weightedScore * coverage);

    return {
      name: topic.name,
      weight: topic.weight,
      minimumExercises: topic.minimumExercises,
      completedExercises,
      missingExercises: Math.max(topic.minimumExercises - completedExercises, 0),
      averageScore: round(weightedScore),
      coveragePercentage: round(coverage * 100),
      preparationPercentage: preparation,
      passingExercises: scoredSolutions.filter(
        (solution) => clampScore(solution.evaluation?.score) >= exam.passingScore
      ).length,
    };
  });

  const preparationPercentage = round(
    topicProgress.reduce(
      (total, topic) => total + topic.preparationPercentage * (topic.weight / 100),
      0
    )
  );
  const minimumsCompleted = topicProgress.every((topic) => topic.missingExercises === 0);

  return {
    preparationPercentage,
    passingScore: exam.passingScore,
    minimumsCompleted,
    ready: minimumsCompleted && preparationPercentage >= exam.passingScore,
    completedExercises: topicProgress.reduce(
      (total, topic) => total + topic.completedExercises,
      0
    ),
    requiredExercises: topicProgress.reduce(
      (total, topic) => total + topic.minimumExercises,
      0
    ),
    topics: topicProgress,
  };
}

function calculateWeightedScore(
  exam: PreparationExam,
  solutions: PreparationSolution[],
  now: Date
) {
  if (solutions.length === 0) return 0;

  const recency = exam.recency;
  const cutoff =
    recency?.enabled && recency.recentWindowDays
      ? now.getTime() - recency.recentWindowDays * 24 * 60 * 60 * 1000
      : null;

  let weightedTotal = 0;
  let totalWeight = 0;

  for (const solution of solutions) {
    const createdAt = solution.createdAt ? new Date(solution.createdAt).getTime() : 0;
    const attemptWeight =
      cutoff !== null
        ? createdAt >= cutoff
          ? recency?.recentAttemptWeight || 1
          : recency?.olderAttemptWeight || 1
        : 1;

    weightedTotal += clampScore(solution.evaluation?.score) * attemptWeight;
    totalWeight += attemptWeight;
  }

  return totalWeight > 0 ? weightedTotal / totalWeight : 0;
}

export function normalizeName(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function clampScore(score?: number) {
  return Math.min(100, Math.max(0, typeof score === "number" ? score : 0));
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}
