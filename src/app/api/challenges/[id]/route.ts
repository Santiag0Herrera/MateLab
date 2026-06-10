import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "../../../../lib/mongodb";
import { getSolutionsForChallenge } from "../../../../lib/challengeResults";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  const db = await getDb();
  const challenge = await db.collection("challenges").findOne({ _id: new ObjectId(id) });

  if (!challenge) {
    return NextResponse.json({ error: "Desafío no encontrado." }, { status: 404 });
  }

  const solutions = await db.collection("solutions").find({
    $or: [
      { challengeId: new ObjectId(id) },
      {
        exerciseId: challenge.exerciseId,
        studentId: { $in: [challenge.senderId, challenge.recipientId] },
      },
    ],
  }).toArray();

  const challengeSolutions = getSolutionsForChallenge(challenge, solutions);

  return NextResponse.json({
    ...serializeChallenge(challenge),
    solutions: challengeSolutions.map(serializeDocument),
  });
}

function serializeChallenge(challenge: any) {
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
