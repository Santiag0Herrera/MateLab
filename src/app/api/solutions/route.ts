import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "../../../lib/mongodb";
import { getChallengeResultFields, getSolutionsForChallenge } from "../../../lib/challengeResults";

interface SolutionBody {
  challengeId?: string | null;
  exerciseId?: string;
  exerciseStatement?: string;
  exerciseTopic?: string;
  studentId?: string;
  imageAttached?: boolean;
  solutionText?: string;
  evaluation?: {
    score?: number;
    feedback?: string;
    corrections?: string[];
    isFallback?: boolean;
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId")?.trim().toUpperCase();

  if (!studentId) {
    return NextResponse.json({ error: "studentId is required." }, { status: 400 });
  }

  const db = await getDb();
  const solutions = await db
    .collection("solutions")
    .find({ studentId })
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();

  return NextResponse.json({ solutions: solutions.map(serializeDocument) });
}

export async function POST(request: Request) {
  let body: SolutionBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const studentId = body.studentId?.trim().toUpperCase();

  if (!studentId || !body.exerciseId || !body.imageAttached) {
    return NextResponse.json(
      { error: "studentId, exerciseId e imageAttached son requeridos." },
      { status: 400 }
    );
  }

  const db = await getDb();
  const now = new Date();
  const challengeObjectId = toObjectId(body.challengeId);

  const existingSolution = await db.collection("solutions").findOne({
    studentId,
    exerciseId: body.exerciseId,
  });

  if (existingSolution) {
    return NextResponse.json(
      {
        error: "Ya resolviste este ejercicio. No podés cargar otra resolución.",
        solution: serializeDocument(existingSolution),
      },
      { status: 409 }
    );
  }

  if (!challengeObjectId) {
    const pendingChallenge = await db.collection("challenges").findOne({
      exerciseId: body.exerciseId,
      recipientId: studentId,
      status: "pending",
      responseStatus: { $ne: "rejected" },
    });

    if (pendingChallenge) {
      return NextResponse.json(
        {
          error:
            "Tenés un desafío pendiente para este ejercicio. Resolvelo desde Mis desafíos.",
          pendingChallengeId: pendingChallenge._id.toString(),
        },
        { status: 409 }
      );
    }
  }

  if (challengeObjectId) {
    const challenge = await db.collection("challenges").findOne({ _id: challengeObjectId });

    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found." }, { status: 404 });
    }

    if (![challenge.senderId, challenge.recipientId].includes(studentId)) {
      return NextResponse.json(
        { error: "This student does not participate in the challenge." },
        { status: 403 }
      );
    }

    if (challenge.responseStatus === "rejected") {
      return NextResponse.json(
        { error: "Este desafío fue rechazado." },
        { status: 403 }
      );
    }

    if ((challenge.responseStatus ?? "accepted") !== "accepted") {
      return NextResponse.json(
        { error: "Debés aceptar el desafío antes de resolverlo." },
        { status: 403 }
      );
    }
  }

  const result = await db.collection("solutions").insertOne({
    challengeId: challengeObjectId,
    challengeIdText: body.challengeId || null,
    exerciseId: body.exerciseId,
    exerciseStatement: body.exerciseStatement || "",
    exerciseTopic: body.exerciseTopic || "",
    studentId,
    imageAttached: true,
    solutionText: body.solutionText || "",
    evaluation: {
      score: body.evaluation?.score,
      feedback: body.evaluation?.feedback || "",
      corrections: body.evaluation?.corrections || [],
      isFallback: !!body.evaluation?.isFallback,
    },
    createdAt: now,
    updatedAt: now,
  });

  if (challengeObjectId) {
    const challenge = await db.collection("challenges").findOne({ _id: challengeObjectId });
    const challengeSolutions = await db
      .collection("solutions")
      .find({
        $or: [
          { challengeId: challengeObjectId },
          {
            exerciseId: challenge?.exerciseId,
            studentId: { $in: [challenge?.senderId, challenge?.recipientId].filter(Boolean) },
          },
        ],
      })
      .toArray();
    const effectiveSolutions = getSolutionsForChallenge(challenge, challengeSolutions);
    const resultFields = getChallengeResultFields(challenge, effectiveSolutions);

    await db.collection("challenges").updateOne(
      { _id: challengeObjectId },
      {
        $set: {
          status: resultFields.status,
          updatedAt: now,
          winnerId: resultFields.winnerId,
          isTie: resultFields.isTie,
          ...(resultFields.status === "completed" ? { completedAt: now } : {}),
        },
        $addToSet: {
          participantIds: studentId,
        },
      }
    );
  }

  const solution = await db.collection("solutions").findOne({ _id: result.insertedId });

  return NextResponse.json({ solution: serializeDocument(solution) }, { status: 201 });
}

function toObjectId(value?: string | null) {
  if (!value || !ObjectId.isValid(value)) {
    return null;
  }

  return new ObjectId(value);
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
