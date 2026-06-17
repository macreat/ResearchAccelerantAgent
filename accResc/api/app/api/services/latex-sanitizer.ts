/* LaTeX sanitizer utilities
 * - Minimal safe cleanup: remove control characters and lone surrogates
 * - Do NOT escape backslashes or braces (preserve LaTeX commands)
 * - Optionally ensure basic brace balancing by appending missing closing braces
 */

export function sanitizeLatex(input: string): string {
  if (!input) return input;

  // Remove non-printable/control characters except newline and tab
  let s = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // Ensure UTF-8 compatible by removing lone surrogates
  s = s.replace(/([\uD800-\uDBFF](?![\uDC00-\uDFFF]))|((?<![\uD800-\uDBFF])[\uDC00-\uDFFF])/g, "");

  // Normalize CRLF to LF
  s = s.replace(/\r\n/g, "\n");

  // Simple brace balancing: if there are unclosed braces, append closing braces
  const rawOpen = (s.match(/\{/g) || []).length;
  const rawClose = (s.match(/\}/g) || []).length;

  if (rawOpen > rawClose) {
    s = s + "\n" + "}".repeat(rawOpen - rawClose);
  }

  return s;
}
