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

/**
 * Recursively extracts plain text from serialized Lexical JSON or returns the input if plain text.
 */
export function extractPlainText(body: string): string {
  if (!body || typeof body !== "string") return "";
  if (!isValidLexicalJson(body)) return body;
  try {
    const data = JSON.parse(body);
    const textFragments: string[] = [];
    const traverse = (node: any) => {
      if (!node) return;
      if (typeof node.text === "string") {
        textFragments.push(node.text);
      }
      if (Array.isArray(node.children)) {
        node.children.forEach(traverse);
      }
    };
    traverse(data.root);
    return textFragments.join(" ").trim();
  } catch {
    return body;
  }
}
