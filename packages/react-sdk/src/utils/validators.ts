const MAX_USERNAME_LEN = 64;
const MAX_PASSWORD_LEN = 4096;

export function isValidUsername(value: unknown): boolean {
  const s = typeof value === "string" ? value.trim() : "";
  return s.length > 0 && s.length <= MAX_USERNAME_LEN;
}

export function isValidPassword(value: unknown): boolean {
  const s = typeof value === "string" ? value : "";
  return s.length > 0 && s.length <= MAX_PASSWORD_LEN;
}
