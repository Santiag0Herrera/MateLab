import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "../../../lib/mongodb";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId")?.trim().toUpperCase();

  if (!studentId) {
    return NextResponse.json({ error: "studentId is required." }, { status: 400 });
  }

  const db = await getDb();

  const [mySolutions, challenges] = await Promise.all([
    db
      .collection("solutions")
      .find({ studentId })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray(),
    db
      .collection("challenges")
      .find({
        $or: [{ senderId: studentId }, { recipientId: studentId }],
      })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray(),
  ]);

  const challengeIds = challenges.map((challenge) => challenge._id);
  const challengeExerciseIds = [...new Set(challenges.map((challenge) => challenge.exerciseId))];
  const participantIds = [
    ...new Set(
      challenges.flatMap((challenge) => [challenge.senderId, challenge.recipientId])
    ),
  ];

  const challengeSolutions =
    challenges.length === 0
      ? []
      : await db
          .collection("solutions")
          .find({
            $or: [
              { challengeId: { $in: challengeIds } },
              {
                exerciseId: { $in: challengeExerciseIds },
                studentId: { $in: participantIds },
              },
            ],
          })
          .sort({ createdAt: -1 })
          .toArray();

  const challengeResults = challenges.map((challenge) => {
    const solutions = challengeSolutions.filter((solution) => {
      const sameChallenge =
        solution.challengeId &&
        solution.challengeId.toString() === challenge._id.toString();
      const sameExerciseAndParticipant =
        solution.exerciseId === challenge.exerciseId &&
        [challenge.senderId, challenge.recipientId].includes(solution.studentId);

      return sameChallenge || sameExerciseAndParticipant;
    });

    return {
      challenge: serializeDocument(challenge),
      solutions: solutions.map(serializeDocument),
    };
  });

  return NextResponse.json({
    mySolutions: mySolutions.map(serializeDocument),
    challengeResults,
  });
}

function serializeDocument(document: any) {
  if (!document) return null;

  return {
    ...document,
    _id: document._id instanceof ObjectId ? document._id.toString() : String(document._id),
    challengeId:
      document.challengeId instanceof ObjectId
        ? document.challengeId.toString()
        : document.challengeId,
    createdAt: document.createdAt?.toISOString?.() ?? document.createdAt,
    updatedAt: document.updatedAt?.toISOString?.() ?? document.updatedAt,
  };
}
