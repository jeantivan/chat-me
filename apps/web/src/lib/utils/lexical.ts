/**
 * Safely validates whether a string represents a valid serialized Lexical editor state JSON.
 */
export function isValidLexicalJson(str: string): boolean {
  if (!str || typeof str !== "string") return false;
  const trimmed = str.trim();
  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) return false;
  try {
    const parsed = JSON.parse(trimmed);
    return typeof parsed === "object" && parsed !== null && "root" in parsed;
  } catch {
    return false;
  }
}
