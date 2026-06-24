import { NextResponse } from "next/server";
import { getDb } from "../../../lib/mongodb";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId")?.trim().toUpperCase();
  const nombre = searchParams.get("nombre")?.trim();
  const exclude = searchParams.get("exclude")?.trim().toUpperCase();

  const db = await getDb();

  // Búsqueda exacta por ID (para login)
  if (studentId) {
    const student = await db
      .collection("students")
      .findOne(
        { publicStudentId: studentId },
        { projection: { publicStudentId: 1, nombre: 1, isPublic: 1, _id: 0 } }
      );

    if (!student) {
      return NextResponse.json({ error: "Estudiante no encontrado." }, { status: 404 });
    }
    return NextResponse.json({ ...student, isPublic: student.isPublic !== false });
  }

  // Búsqueda por nombre (para desafiar)
  if (!nombre || nombre.length < 2) {
    return NextResponse.json([]);
  }

  const query: Record<string, unknown> = {
    nombre: { $regex: nombre, $options: "i" },
    isPublic: { $ne: false },
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

export async function PATCH(request: Request) {
  let body: { studentId?: string; isPublic?: boolean };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const publicStudentId = body.studentId?.trim().toUpperCase();

  if (!publicStudentId || typeof body.isPublic !== "boolean") {
    return NextResponse.json(
      { error: "studentId and isPublic are required." },
      { status: 400 }
    );
  }

  const db = await getDb();
  const result = await db.collection("students").findOneAndUpdate(
    { publicStudentId },
    { $set: { isPublic: body.isPublic, updatedAt: new Date() } },
    {
      returnDocument: "after",
      projection: { publicStudentId: 1, nombre: 1, isPublic: 1, _id: 0 },
    }
  );

  if (!result) {
    return NextResponse.json({ error: "Estudiante no encontrado." }, { status: 404 });
  }

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  let body: { studentId?: string; nombre?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const publicStudentId = body.studentId?.trim().toUpperCase();
  const nombre = body.nombre?.trim();

  if (!publicStudentId) {
    return NextResponse.json({ error: "studentId is required." }, { status: 400 });
  }

  const db = await getDb();
  const now = new Date();

  const setFields: Record<string, unknown> = { publicStudentId, updatedAt: now };
  if (nombre) setFields.nombre = nombre;

  await db.collection("students").updateOne(
    { publicStudentId },
    {
      $set: setFields,
      $setOnInsert: { createdAt: now, isPublic: true },
    },
    { upsert: true }
  );

  return NextResponse.json({ student: { publicStudentId, nombre } });
}
