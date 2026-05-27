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
  const solution = await db.collection("solutions").findOne({
    studentId,
    exerciseId,
  });

  return NextResponse.json({
    solved: !!solution,
    solution: serializeDocument(solution),
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
