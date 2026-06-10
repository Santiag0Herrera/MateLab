import { NextResponse } from "next/server";
import { getDb } from "../../../lib/mongodb";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const nombre = searchParams.get("nombre")?.trim();
  const exclude = searchParams.get("exclude")?.trim().toUpperCase();

  if (!nombre || nombre.length < 2) {
    return NextResponse.json([]);
  }

  const db = await getDb();
  const query: Record<string, unknown> = {
    nombre: { $regex: nombre, $options: "i" },
  };
  if (exclude) {
    query.publicStudentId = { $ne: exclude };
  }

  const students = await db
    .collection("students")
    .find(query, { projection: { publicStudentId: 1, nombre: 1, _id: 0 } })
    .limit(10)
    .toArray();

  return NextResponse.json(students);
}

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
