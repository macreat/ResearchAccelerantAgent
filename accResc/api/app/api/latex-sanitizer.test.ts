import { describe, it, expect } from 'vitest';
import { sanitizeLatex } from './services/latex-sanitizer';

describe('LaTeX sanitizer', () => {
  it('escapes special characters and balances braces', () => {
    const raw = "This % text & has $pecial # chars _ and {unclosed brace";
    const out = sanitizeLatex(raw);
    expect(out).toContain('\\%');
    expect(out).toContain('\\&');
    expect(out).toContain('\\$');
    expect(out).toContain('\\#');
    expect(out).toContain('\\_');
    // Should contain escaped braces sequences
    expect(out).toContain('\\{');
    expect(out).toContain('\\}');
  });
});
