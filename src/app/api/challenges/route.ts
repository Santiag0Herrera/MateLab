import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "../../../lib/mongodb";
import { getChallengeResultFields, getSolutionsForChallenge } from "../../../lib/challengeResults";

interface ChallengeBody {
  exerciseId?: string;
  exerciseStatement?: string;
  exerciseTopic?: string;
  senderId?: string;
  senderName?: string;
  recipientId?: string;
  recipientName?: string;
  message?: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId")?.trim().toUpperCase();

  if (!studentId) {
    return NextResponse.json({ error: "studentId is required." }, { status: 400 });
  }

  const db = await getDb();

  const [received, sent] = await Promise.all([
    db
      .collection("challenges")
      .find({ recipientId: studentId })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray(),
    db
      .collection("challenges")
      .find({ senderId: studentId })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray(),
  ]);

  const challengeIds = [...received, ...sent].map((challenge) => challenge._id);
  const challengeExerciseIds = [...new Set([...received, ...sent].map((challenge) => challenge.exerciseId))];
  const participantIds = [
    ...new Set([...received, ...sent].flatMap((challenge) => [challenge.senderId, challenge.recipientId])),
  ];
  const challengeSolutions =
    challengeIds.length === 0
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
          .toArray();

  return NextResponse.json({
    received: received.map((challenge) => serializeChallengeForStudent(challenge, challengeSolutions, studentId)),
    sent: sent.map((challenge) => serializeChallengeForStudent(challenge, challengeSolutions, studentId)),
  });
}

export async function POST(request: Request) {
  let body: ChallengeBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const senderId = body.senderId?.trim().toUpperCase();
  const recipientId = body.recipientId?.trim().toUpperCase();

  if (!body.exerciseId || !senderId || !recipientId) {
    return NextResponse.json(
      { error: "exerciseId, senderId, and recipientId are required." },
      { status: 400 }
    );
  }

  if (senderId === recipientId) {
    return NextResponse.json(
      { error: "You cannot challenge your own student ID." },
      { status: 400 }
    );
  }

  const db = await getDb();
  const now = new Date();

  const recipient = await db.collection("students").findOne(
    { publicStudentId: recipientId },
    { projection: { isPublic: 1 } }
  );

  if (!recipient) {
    return NextResponse.json({ error: "El estudiante destinatario no existe." }, { status: 404 });
  }

  if (recipient.isPublic === false) {
    return NextResponse.json(
      { error: "Este estudiante no está disponible para recibir desafíos." },
      { status: 403 }
    );
  }

  await db.collection("students").updateOne(
    { publicStudentId: senderId },
    {
      $set: { publicStudentId: senderId, updatedAt: now },
      $setOnInsert: { createdAt: now, isPublic: true },
    },
    { upsert: true }
  );

  const result = await db.collection("challenges").insertOne({
    exerciseId: body.exerciseId,
    exerciseStatement: body.exerciseStatement || "",
    exerciseTopic: body.exerciseTopic || "",
    senderId,
    senderName: body.senderName || "",
    recipientId,
    recipientName: body.recipientName || "",
    message: body.message || "",
    status: "pending",
    createdAt: now,
    updatedAt: now,
  });

  const challenge = await db.collection("challenges").findOne({ _id: result.insertedId });
  const existingSolutions = await db
    .collection("solutions")
    .find({
      exerciseId: body.exerciseId,
      studentId: { $in: [senderId, recipientId] },
    })
    .toArray();
  const resultFields = getChallengeResultFields(challenge, existingSolutions);

  if (existingSolutions.length > 0) {
    const completedAt = resultFields.status === "completed" ? now : null;

    await db.collection("challenges").updateOne(
      { _id: result.insertedId },
      {
        $set: {
          status: resultFields.status,
          winnerId: resultFields.winnerId,
          isTie: resultFields.isTie,
          ...(completedAt ? { completedAt } : {}),
          updatedAt: now,
        },
        $addToSet: {
          participantIds: { $each: existingSolutions.map((solution) => solution.studentId) },
        },
      }
    );
  }

  const updatedChallenge = await db.collection("challenges").findOne({ _id: result.insertedId });

  return NextResponse.json({ challenge: serializeChallenge(updatedChallenge) }, { status: 201 });
}

function serializeChallengeForStudent(challenge: any, solutions: any[], studentId: string) {
  const challengeSolutions = getSolutionsForChallenge(challenge, solutions);

  return {
    ...serializeChallenge(challenge),
    solvedByCurrentStudent: challengeSolutions.some(
      (solution) => solution.studentId === studentId
    ),
    solutions: challengeSolutions.map(serializeDocument),
  };
}

function serializeChallenge(challenge: any) {
  if (!challenge) return null;

  return {
    ...challenge,
    _id: challenge._id instanceof ObjectId ? challenge._id.toString() : String(challenge._id),
    createdAt: challenge.createdAt?.toISOString?.() ?? challenge.createdAt,
    completedAt: challenge.completedAt?.toISOString?.() ?? challenge.completedAt,
    updatedAt: challenge.updatedAt?.toISOString?.() ?? challenge.updatedAt,
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
    updatedAt: document.updatedAt?.toISOString?.() ?? document.updatedAt,
  };
}
