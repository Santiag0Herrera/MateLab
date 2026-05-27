import { NextResponse } from "next/server";
import { getDb } from "../../../lib/mongodb";

export async function POST(request: Request) {
  let body: { studentId?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const publicStudentId = body.studentId?.trim().toUpperCase();

  if (!publicStudentId) {
    return NextResponse.json({ error: "studentId is required." }, { status: 400 });
  }

  const db = await getDb();
  const now = new Date();

  await db.collection("students").updateOne(
    { publicStudentId },
    {
      $set: {
        publicStudentId,
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true }
  );

  return NextResponse.json({ student: { publicStudentId } });
}
