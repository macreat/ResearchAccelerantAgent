/* LaTeX sanitizer utilities
 * - Remove Markdown syntax and convert to native LaTeX
 * - Remove control characters and lone surrogates
 * - Ensure basic brace balancing
 * - Detect and repair common LaTeX errors before compilation
 */

export function sanitizeLatex(input: string): string {
  if (!input) return input;

  let s = input;

  // ================================================================
  // STEP 1: Strip Markdown syntax
  // ================================================================

  // Remove triple backtick code fences (``` ... ```)
  s = s.replace(/```[\s\S]*?```/g, "");

  // Remove inline backticks, wrap content in \texttt
  s = s.replace(/`([^`]+)`/g, "\\texttt{$1}");

  // Convert Markdown headings (# through ######) at line start to plain bold
  s = s.replace(/^#{1,6}\s+(.+)$/gm, "\\textbf{$1}");

  // Convert **bold** to \textbf{}
  s = s.replace(/\*\*([^*]+)\*\*/g, "\\textbf{$1}");

  // Convert *italic* to \emph{} (but not if inside \textbf already)
  s = s.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "\\emph{$1}");

  // Convert Markdown unordered list items (- item) to \item
  s = s.replace(/^[-*]\s+(.+)$/gm, "\\item $1");

  // Convert Markdown ordered list items (1. item) to \item
  s = s.replace(/^\d+\.\s+(.+)$/gm, "\\item $1");

  // ================================================================
  // STEP 2: Remove control characters
  // ================================================================

  s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // Remove lone surrogates
  s = s.replace(/([\uD800-\uDBFF](?![\uDC00-\uDFFF]))|((?<![\uD800-\uDBFF])[\uDC00-\uDFFF])/g, "");

  // Normalize CRLF to LF
  s = s.replace(/\r\n/g, "\n");

  // ================================================================
  // STEP 3: Fix common LaTeX errors
  // ================================================================

  // Remove consecutive empty lines beyond 2 (pdflatex chokes on too many)
  s = s.replace(/\n{4,}/g, "\n\n\n");

  // Ensure \begin and \end are on their own lines
  s = s.replace(/([^\n])\\begin\{/g, "$1\n\\begin{");
  s = s.replace(/([^\n])\\end\{/g, "$1\n\\end{");

  // ================================================================
  // STEP 4: Brace balancing
  // ================================================================

  // Count only braces outside comments
  const lines = s.split("\n");
  let openCount = 0;
  let closeCount = 0;
  for (const line of lines) {
    const commentIdx = line.indexOf("%");
    const codePart = commentIdx >= 0 ? line.substring(0, commentIdx) : line;
    for (const ch of codePart) {
      if (ch === "{") openCount++;
      if (ch === "}") closeCount++;
    }
  }

  if (openCount > closeCount) {
    s = s + "\n" + "}".repeat(openCount - closeCount);
  }

  return s;
}

/**
 * Perform a compilation audit on a LaTeX document string.
 * Checks for:
 * - Every \begin{X} has matching \end{X}
 * - Common missing packages
 * - Markdown remnants
 * Returns warnings array (empty if clean).
 */
export function auditLatexDocument(content: string): string[] {
  const warnings: string[] = [];

  if (!content) return warnings;

  // Check for remaining Markdown syntax
  if (/```/.test(content)) warnings.push("Markdown code fences still present");
  if (/^#{1,6}\s/m.test(content)) warnings.push("Markdown headings still present");
  if (/\*\*[^*]+\*\*/.test(content)) warnings.push("Markdown bold (**) still present");

  // Check begin/end matching
  const beginMatches = content.match(/\\begin\{(\w+)\}/g) || [];
  const endMatches = content.match(/\\end\{(\w+)\}/g) || [];
  if (beginMatches.length !== endMatches.length) {
    warnings.push(`Mismatched \\begin{}/\\end{} pairs: ${beginMatches.length} begin vs ${endMatches.length} end`);
  }

  // Check for environments that need packages
  const envs = content.match(/\\begin\{(\w+)\}/g) || [];
  const envNames = envs.map(e => e.match(/\{(\w+)\}/)![1]);
  const uniqueEnvs = [...new Set(envNames)];

  const packageMap: Record<string, string> = {
    "tcolorbox": "tcolorbox",
    "longtable": "longtable",
    "tikzpicture": "tikz",
    "lstlisting": "listings",
    "minted": "minted",
  };

  for (const env of uniqueEnvs) {
    if (packageMap[env]) {
      const pkg = packageMap[env];
      const pkgRegex = new RegExp(`\\\\usepackage(\\[[^\\]]*\\])?\\{${pkg.replace(/-/g, "")}\\}`);
      if (!pkgRegex.test(content) && !new RegExp(`\\\\usepackage\\[most\\]\\{${pkg}\\}`).test(content)) {
        if (env === "tcolorbox") {
          // tcolorbox might be loaded via [most]
          if (!/\\usepackage\[most\]\{tcolorbox\}/.test(content)) {
            warnings.push(`Environment '${env}' requires \\usepackage[most]{${pkg}}`);
          }
        } else {
          warnings.push(`Environment '${env}' may require \\usepackage{${pkg}}`);
        }
      }
    }
  }

  return warnings;
}
