import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "../../../lib/mongodb";
import {
  calculateExamPreparation,
  normalizeName,
} from "../../../lib/examPreparation";

interface TopicInput {
  name?: string;
  minimumExercises?: number;
  weight?: number;
}

interface SubjectBody {
  subjectName?: string;
  examName?: string;
  passingScore?: number;
  topics?: TopicInput[];
  recency?: {
    enabled?: boolean;
    recentWindowDays?: number;
    recentAttemptWeight?: number;
    olderAttemptWeight?: number;
  };
  createdBy?: string;
}

interface SubjectDocument {
  name: string;
  normalizedName: string;
  exams: any[];
  createdAt: Date;
  updatedAt: Date;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId")?.trim().toUpperCase();

  if (!studentId) {
    return NextResponse.json({ error: "studentId is required." }, { status: 400 });
  }

  const db = await getDb();
  const [subjects, solutions] = await Promise.all([
    db.collection<SubjectDocument>("subjects").find({}).sort({ name: 1 }).toArray(),
    db
      .collection("solutions")
      .find(
        { studentId },
        { projection: { exerciseTopic: 1, evaluation: 1, createdAt: 1 } }
      )
      .toArray(),
  ]);

  const ownSubjects = subjects
    .map((subject) => ({
      ...subject,
      exams: (subject.exams || []).filter((exam: any) => exam.createdBy === studentId),
    }))
    .filter((subject) => subject.exams.length > 0);

  return NextResponse.json(ownSubjects.map((subject) => serializeSubject(subject, solutions)));
}

export async function POST(request: Request) {
  let body: SubjectBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const subjectName = body.subjectName?.trim();
  const examName = body.examName?.trim();
  const passingScore = Number(body.passingScore);
  const createdBy = body.createdBy?.trim().toUpperCase();
  const topics = (body.topics || []).map((topic) => ({
    name: topic.name?.trim() || "",
    normalizedName: normalizeName(topic.name || ""),
    minimumExercises: Number(topic.minimumExercises),
    weight: Number(topic.weight),
  }));

  if (!subjectName || !examName) {
    return NextResponse.json(
      { error: "La materia y el nombre del examen son requeridos." },
      { status: 400 }
    );
  }

  if (!createdBy) {
    return NextResponse.json(
      { error: "No se encontró el estudiante de la sesión." },
      { status: 400 }
    );
  }

  if (topics.length === 0 || topics.some((topic) => !topic.name)) {
    return NextResponse.json(
      { error: "El examen debe incluir al menos un tema válido." },
      { status: 400 }
    );
  }

  if (new Set(topics.map((topic) => topic.normalizedName)).size !== topics.length) {
    return NextResponse.json(
      { error: "No puede haber temas repetidos dentro del examen." },
      { status: 400 }
    );
  }

  if (
    topics.some(
      (topic) =>
        !Number.isInteger(topic.minimumExercises) ||
        topic.minimumExercises < 1 ||
        !Number.isFinite(topic.weight) ||
        topic.weight <= 0 ||
        topic.weight > 100
    )
  ) {
    return NextResponse.json(
      { error: "Cada tema debe tener un mínimo entero y un peso entre 1 y 100." },
      { status: 400 }
    );
  }

  const totalWeight = topics.reduce((total, topic) => total + topic.weight, 0);
  if (Math.abs(totalWeight - 100) > 0.01) {
    return NextResponse.json(
      { error: "Los pesos de los temas deben sumar exactamente 100%." },
      { status: 400 }
    );
  }

  if (!Number.isFinite(passingScore) || passingScore < 0 || passingScore > 100) {
    return NextResponse.json(
      { error: "El puntaje de aprobación debe estar entre 0 y 100." },
      { status: 400 }
    );
  }

  const recencyEnabled = body.recency?.enabled === true;
  const recentWindowDays = Number(body.recency?.recentWindowDays ?? 30);
  const recentAttemptWeight = Number(body.recency?.recentAttemptWeight ?? 2);
  const olderAttemptWeight = Number(body.recency?.olderAttemptWeight ?? 1);

  if (
    recencyEnabled &&
    (!Number.isInteger(recentWindowDays) ||
      recentWindowDays < 1 ||
      !Number.isFinite(recentAttemptWeight) ||
      recentAttemptWeight <= 0 ||
      !Number.isFinite(olderAttemptWeight) ||
      olderAttemptWeight <= 0)
  ) {
    return NextResponse.json(
      { error: "La configuración de intentos recientes no es válida." },
      { status: 400 }
    );
  }

  const db = await getDb();
  const subjects = db.collection<SubjectDocument>("subjects");
  const normalizedName = normalizeName(subjectName);
  const normalizedExamName = normalizeName(examName);
  const existingSubject = await subjects.findOne(
    { normalizedName },
    { projection: { exams: 1 } }
  );

  if (
    existingSubject?.exams?.some(
      (exam: { normalizedName?: string; createdBy?: string }) =>
        exam.normalizedName === normalizedExamName && exam.createdBy === createdBy
    )
  ) {
    return NextResponse.json(
      { error: "Ya existe un examen con ese nombre para la materia." },
      { status: 409 }
    );
  }

  const now = new Date();
  const examId = new ObjectId();
  const exam = {
    _id: examId,
    name: examName,
    normalizedName: normalizedExamName,
    passingScore,
    topics,
    recency: {
      enabled: recencyEnabled,
      recentWindowDays: recencyEnabled ? recentWindowDays : null,
      recentAttemptWeight: recencyEnabled ? recentAttemptWeight : 1,
      olderAttemptWeight: recencyEnabled ? olderAttemptWeight : 1,
    },
    createdBy,
    createdAt: now,
    updatedAt: now,
  };

  await subjects.updateOne(
    { normalizedName },
    {
      $set: { name: subjectName, normalizedName, updatedAt: now },
      $setOnInsert: { createdAt: now },
      $push: { exams: exam },
    },
    { upsert: true }
  );

  return NextResponse.json(
    {
      subject: subjectName,
      exam: serializeExam(exam),
    },
    { status: 201 }
  );
}

function serializeSubject(subject: any, solutions: any[] | null = null) {
  return {
    id: subject._id.toString(),
    name: subject.name,
    exams: (subject.exams || []).map((exam: any) => serializeExam(exam, solutions)),
    createdAt: subject.createdAt?.toISOString?.() ?? subject.createdAt,
    updatedAt: subject.updatedAt?.toISOString?.() ?? subject.updatedAt,
  };
}

function serializeExam(exam: any, solutions: any[] | null = null) {
  return {
    ...exam,
    id: exam._id.toString(),
    _id: undefined,
    preparation: solutions ? calculateExamPreparation(exam, solutions) : undefined,
    createdAt: exam.createdAt?.toISOString?.() ?? exam.createdAt,
    updatedAt: exam.updatedAt?.toISOString?.() ?? exam.updatedAt,
  };
}
