import { NextResponse } from "next/server";
import { getDb } from "../../../lib/mongodb";

export async function GET() {
  const db = await getDb();
  const docs = await db
    .collection("exercises")
    .find({}, { projection: { _id: 1, topic: 1, source: 1, difficulty: 1, statement: 1, concepts: 1 } })
    .sort({ createdAt: -1 })
    .toArray();

  const exercises = docs.map((doc) => ({
    id: doc._id.toString(),
    topic: doc.topic,
    source: doc.source,
    difficulty: doc.difficulty,
    statement: doc.statement,
    concepts: doc.concepts ?? [],
  }));

  return NextResponse.json(exercises);
}

export async function POST(request: Request) {
  let body: {
    topic?: string;
    statement?: string;
    source?: string;
    difficulty?: string;
    concepts?: string[];
    uploadedBy?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const { topic, statement, source, difficulty, concepts, uploadedBy } = body;

  if (!topic?.trim() || !statement?.trim()) {
    return NextResponse.json({ error: "topic y statement son requeridos." }, { status: 400 });
  }

  const db = await getDb();
  const now = new Date();

  const result = await db.collection("exercises").insertOne({
    topic: topic.trim(),
    statement: statement.trim(),
    source: source ?? "Subido por alumno",
    difficulty: difficulty ?? "Media",
    concepts: concepts ?? [],
    uploadedBy: uploadedBy ?? null,
    createdAt: now,
  });

  return NextResponse.json(
    { id: result.insertedId.toString(), topic, statement, source, difficulty, concepts, uploadedBy },
    { status: 201 }
  );
}
