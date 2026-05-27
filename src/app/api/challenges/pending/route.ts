import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "../../../../lib/mongodb";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId")?.trim().toUpperCase();
  const exerciseId = searchParams.get("exerciseId")?.trim();

  if (!studentId || !exerciseId) {
    return NextResponse.json(
      { error: "studentId and exerciseId are required." },
      { status: 400 }
    );
  }

  const db = await getDb();
  const challenge = await db.collection("challenges").findOne({
    exerciseId,
    recipientId: studentId,
    status: "pending",
  });

  return NextResponse.json({
    pendingChallenge: serializeChallenge(challenge),
  });
}

function serializeChallenge(challenge: any) {
  if (!challenge) return null;

  return {
    ...challenge,
    _id: challenge._id instanceof ObjectId ? challenge._id.toString() : String(challenge._id),
    createdAt: challenge.createdAt?.toISOString?.() ?? challenge.createdAt,
    updatedAt: challenge.updatedAt?.toISOString?.() ?? challenge.updatedAt,
  };
}
