/**
 * In-Memory Store Service
 * Fallback data store when database is unavailable.
 * Uses Maps for O(1) lookups and maintains referential integrity.
 */

// ============================================================================
// Types
// ============================================================================
export interface Session {
  id: number;
  topic: string;
  numStudies: number;
  yearFrom: number;
  yearTo: number;
  citationMin: number;
  databases: string;
  keywords?: string;
  inclusionCriteria?: string;
  exclusionCriteria?: string;
  bibFormat: string;
  status: string;
  version: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Paper {
  id: number;
  sessionId: number;
  externalId: string;
  source: string;
  title: string;
  authors: string;
  year: number | null;
  journal: string | null;
  volume: string | null;
  issue: string | null;
  pages: string | null;
  doi: string | null;
  url: string | null;
  abstract: string | null;
  citationCount: number | null;
  citationCountSource: string | null;
  pdfUrl: string | null;
  relevanceScore: number | null;
  isSelected: number;
  createdAt: Date;
}

export interface SynthesisResult {
  id: number;
  sessionId: number;
  methodologicalPatterns: string | null;
  overarchingFindings: string | null;
  recurringGaps: string | null;
  impactAssessment: string | null;
  futureDirections: string | null;
  identifiedGaps: string[] | null;
  rawSynthesis: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProblemStatement {
  id: number;
  sessionId: number;
  whatIsKnown: string | null;
  whatIsMissing: string | null;
  affectedStakeholders: string | null;
  consequencesOfInaction: string | null;
  howStudyAddressesGap: string | null;
  selectedGapIndex: number | null;
  fullStatement: string | null;
  latexOutput: string | null;
  status: string;
  humanFeedback: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LatexOutput {
  id: number;
  sessionId: number;
  documentType: string;
  latexContent: string;
  compiledPdfUrl: string | null;
  createdAt: Date;
}

// ============================================================================
// In-Memory Store
// ============================================================================
class MemoryStore {
  private sessions = new Map<number, Session>();
  private papers = new Map<number, Paper>();
  private synthesisResults = new Map<number, SynthesisResult>();
  private problemStatements = new Map<number, ProblemStatement>();
  private latexOutputs = new Map<number, LatexOutput>();
  private nextId = 1;

  private getNextId(): number {
    return this.nextId++;
  }

  // Sessions
  createSession(data: Omit<Session, "id" | "createdAt" | "updatedAt">): Session {
    const id = this.getNextId();
    const now = new Date();
    const session: Session = { ...data, id, createdAt: now, updatedAt: now };
    this.sessions.set(id, session);
    return session;
  }

  getSession(id: number): Session | undefined {
    return this.sessions.get(id);
  }

  listSessions(): Session[] {
    return Array.from(this.sessions.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  updateSession(id: number, data: Partial<Session>): Session | undefined {
    const existing = this.sessions.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data, updatedAt: new Date() };
    this.sessions.set(id, updated);
    return updated;
  }

  deleteSession(id: number): boolean {
    // Cascade delete papers
    for (const [pid, paper] of this.papers) {
      if (paper.sessionId === id) this.papers.delete(pid);
    }
    // Cascade delete synthesis
    for (const [sid, syn] of this.synthesisResults) {
      if (syn.sessionId === id) this.synthesisResults.delete(sid);
    }
    // Cascade delete problem statements
    for (const [psid, ps] of this.problemStatements) {
      if (ps.sessionId === id) this.problemStatements.delete(psid);
    }
    // Cascade delete latex outputs
    for (const [loid, lo] of this.latexOutputs) {
      if (lo.sessionId === id) this.latexOutputs.delete(loid);
    }
    return this.sessions.delete(id);
  }

  // Papers
  addPaper(data: Omit<Paper, "id" | "createdAt">): Paper {
    const id = this.getNextId();
    const paper: Paper = { ...data, id, createdAt: new Date() };
    this.papers.set(id, paper);
    return paper;
  }

  getPapersForSession(sessionId: number): Paper[] {
    return Array.from(this.papers.values())
      .filter((p) => p.sessionId === sessionId)
      .sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0));
  }

  // Synthesis
  createSynthesis(data: Omit<SynthesisResult, "id" | "createdAt" | "updatedAt">): SynthesisResult {
    const id = this.getNextId();
    const now = new Date();
    const syn: SynthesisResult = { ...data, id, createdAt: now, updatedAt: now };
    this.synthesisResults.set(id, syn);
    return syn;
  }

  getSynthesisForSession(sessionId: number): SynthesisResult | undefined {
    return Array.from(this.synthesisResults.values()).find(
      (s) => s.sessionId === sessionId
    );
  }

  updateSynthesis(sessionId: number, data: Partial<SynthesisResult>): SynthesisResult | undefined {
    const existing = this.getSynthesisForSession(sessionId);
    if (!existing) return undefined;
    const updated = { ...existing, ...data, updatedAt: new Date() };
    this.synthesisResults.set(existing.id, updated);
    return updated;
  }

  // Problem Statements
  createProblemStatement(data: Omit<ProblemStatement, "id" | "createdAt" | "updatedAt">): ProblemStatement {
    const id = this.getNextId();
    const now = new Date();
    const ps: ProblemStatement = { ...data, id, createdAt: now, updatedAt: now };
    this.problemStatements.set(id, ps);
    return ps;
  }

  getProblemStatementForSession(sessionId: number): ProblemStatement | undefined {
    return Array.from(this.problemStatements.values()).find(
      (p) => p.sessionId === sessionId
    );
  }

  updateProblemStatement(sessionId: number, data: Partial<ProblemStatement>): ProblemStatement | undefined {
    const existing = this.getProblemStatementForSession(sessionId);
    if (!existing) return undefined;
    const updated = { ...existing, ...data, updatedAt: new Date() };
    this.problemStatements.set(existing.id, updated);
    return updated;
  }

  // LaTeX Outputs
  createLatexOutput(data: Omit<LatexOutput, "id" | "createdAt">): LatexOutput {
    const id = this.getNextId();
    const lo: LatexOutput = { ...data, id, createdAt: new Date() };
    this.latexOutputs.set(id, lo);
    return lo;
  }

  getLatexOutputsForSession(sessionId: number): LatexOutput[] {
    return Array.from(this.latexOutputs.values())
      .filter((l) => l.sessionId === sessionId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

// Singleton export
export const memoryStore = new MemoryStore();
