const STUDENT_ID_KEY = "matelab-student-id";

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
  localStorage.setItem(STUDENT_ID_KEY, newId);
  return newId;
}
