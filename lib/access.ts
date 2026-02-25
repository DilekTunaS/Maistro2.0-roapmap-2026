export const ACCESS_COOKIE_NAME = "maistro_access";

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function generateAccessCode(): string {
  const token = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `MAI-${token}`;
}

