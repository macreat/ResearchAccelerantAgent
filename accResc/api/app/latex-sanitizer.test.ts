import { describe, it, expect } from 'vitest';
import { sanitizeLatex } from './api/services/latex-sanitizer';

describe('LaTeX sanitizer', () => {
  it('escapes special characters and balances braces', () => {
    const raw = "This % text & has $pecial # chars _ and {unclosed brace";
    const out = sanitizeLatex(raw);
    expect(out).toContain('\\%');
    expect(out).toContain('\\&');
    expect(out).toContain('\\$');
    expect(out).toContain('\\#');
    expect(out).toContain('\\_');
    // Should not contain raw unescaped '{' (sanitizer escapes braces)
    expect(out.includes('{')).toBe(false);
  });
});
