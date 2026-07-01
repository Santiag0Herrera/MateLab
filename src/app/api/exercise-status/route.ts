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
  const [solutions, challenges] = await Promise.all([
    db.collection("solutions").find({ studentId }).toArray(),
    db
      .collection("challenges")
      .find({
        $or: [{ senderId: studentId }, { recipientId: studentId }],
      })
      .sort({ createdAt: -1 })
      .toArray(),
  ]);

  const exerciseIds = [
    ...new Set([
      ...solutions.map((solution) => solution.exerciseId),
      ...challenges.map((challenge) => challenge.exerciseId),
    ]),
  ];

  const statuses = exerciseIds.reduce<Record<string, any>>((acc, exerciseId) => {
    const solution = solutions.find((item) => item.exerciseId === exerciseId);
    const exerciseChallenges = challenges.filter((challenge) => {
      if (challenge.exerciseId !== exerciseId) return false;
      const isRecipient = challenge.recipientId === studentId;
      return !(isRecipient && challenge.responseStatus === "rejected");
    });
    const visibleChallenge =
      exerciseChallenges.find((challenge) => challenge.status !== "completed") ||
      exerciseChallenges[0] ||
      null;

    acc[exerciseId] = {
      solution: serializeDocument(solution),
      challenges: exerciseChallenges.map((challenge) =>
        serializeChallengeWithPerspective(challenge, studentId)
      ),
      latestChallenge: visibleChallenge
        ? serializeChallengeWithPerspective(visibleChallenge, studentId)
        : null,
    };

    return acc;
  }, {});

  return NextResponse.json({ statuses });
}

function serializeChallengeWithPerspective(challenge: any, studentId: string) {
  const isSender = challenge.senderId === studentId;
  return {
    ...serializeDocument(challenge),
    opponentId: isSender ? challenge.recipientId : challenge.senderId,
    opponentName: isSender ? (challenge.recipientName || "") : (challenge.senderName || ""),
    role: isSender ? "sender" : "recipient",
  };
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
    completedAt: document.completedAt?.toISOString?.() ?? document.completedAt,
    updatedAt: document.updatedAt?.toISOString?.() ?? document.updatedAt,
  };
}
