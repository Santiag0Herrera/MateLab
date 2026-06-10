const STUDENT_ID_KEY = "matelab-student-id";
const STUDENT_NAME_KEY = "matelab-student-name";

const NOMBRES = [
  "Valentina", "Mateo", "Lucía", "Sebastián", "Camila",
  "Nicolás", "Sofía", "Tomás", "Martina", "Agustín",
];

function createStudentId() {
  const randomValue =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);

  return `ML-${randomValue.toUpperCase()}`;
}

export function getOrCreateStudentId() {
  const storedId = localStorage.getItem(STUDENT_ID_KEY);

  if (storedId) {
    return storedId;
  }

  const newId = createStudentId();
  const randomName = NOMBRES[Math.floor(Math.random() * NOMBRES.length)];
  localStorage.setItem(STUDENT_ID_KEY, newId);
  localStorage.setItem(STUDENT_NAME_KEY, randomName);
  return newId;
}

export function getStudentName(): string {
  return localStorage.getItem(STUDENT_NAME_KEY) ?? "";
}
