import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "../../../../lib/mongodb";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  const db = await getDb();
  const doc = await db.collection("exercises").findOne(
    { _id: new ObjectId(id) },
    { projection: { _id: 1, topic: 1, source: 1, difficulty: 1, statement: 1, concepts: 1 } }
  );

  if (!doc) {
    return NextResponse.json({ error: "Ejercicio no encontrado." }, { status: 404 });
  }

  return NextResponse.json({
    id: doc._id.toString(),
    topic: doc.topic,
    source: doc.source,
    difficulty: doc.difficulty,
    statement: doc.statement,
    concepts: doc.concepts ?? [],
  });
}
