// lib/auth.ts
export const NAME_KEY = "rbg_name";

export function getStoredName(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(NAME_KEY);
}

export function setStoredName(name: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(NAME_KEY, name);
}

export function clearStoredName() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(NAME_KEY);
}
