export function getSolutionsForChallenge(challenge: any, solutions: any[]) {
  const participantIds = [challenge.senderId, challenge.recipientId];
  const byChallengeId = solutions.filter(
    (solution) => solution.challengeId?.toString() === challenge._id.toString()
  );
  const byExistingExercise = solutions.filter(
    (solution) =>
      solution.exerciseId === challenge.exerciseId &&
      participantIds.includes(solution.studentId)
  );

  const merged = [...byChallengeId, ...byExistingExercise];
  const byStudent = new Map<string, any>();

  for (const solution of merged) {
    const existing = byStudent.get(solution.studentId);

    if (
      !existing ||
      new Date(solution.createdAt).getTime() > new Date(existing.createdAt).getTime()
    ) {
      byStudent.set(solution.studentId, solution);
    }
  }

  return [...byStudent.values()];
}

export function getChallengeResultFields(challenge: any, solutions: any[]) {
  const participantIds = [challenge.senderId, challenge.recipientId].filter(Boolean);
  const solvedParticipantIds = new Set(solutions.map((solution) => solution.studentId));
  const isCompleted =
    participantIds.length === 2 &&
    participantIds.every((participantId) => solvedParticipantIds.has(participantId));

  if (!isCompleted) {
    return {
      status: solutions.length > 0 ? "in-progress" : "pending",
      winnerId: null,
      isTie: false,
      completedAt: null,
    };
  }

  const [firstParticipantId, secondParticipantId] = participantIds;
  const firstSolution = solutions.find((solution) => solution.studentId === firstParticipantId);
  const secondSolution = solutions.find((solution) => solution.studentId === secondParticipantId);
  const firstScore = getScore(firstSolution);
  const secondScore = getScore(secondSolution);

  if (firstScore === null || secondScore === null || firstScore === secondScore) {
    return {
      status: "completed",
      winnerId: null,
      isTie: firstScore === secondScore,
    };
  }

  return {
    status: "completed",
    winnerId: firstScore > secondScore ? firstParticipantId : secondParticipantId,
    isTie: false,
  };
}

function getScore(solution: any) {
  const score = solution?.evaluation?.score;
  return typeof score === "number" ? score : null;
}
