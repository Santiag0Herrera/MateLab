const SESSION_KEY = "matelab-session";

export interface StudentSession {
  publicStudentId: string;
  nombre: string;
  isPublic?: boolean;
}

export function getStudentSession(): StudentSession | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(SESSION_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function saveStudentSession(session: StudentSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearStudentSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

// Shims para compatibilidad con componentes existentes
export function getOrCreateStudentId(): string {
  return getStudentSession()?.publicStudentId ?? "";
}

export function getStudentName(): string {
  return getStudentSession()?.nombre ?? "";
}
