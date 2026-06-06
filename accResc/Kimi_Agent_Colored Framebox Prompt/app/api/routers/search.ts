import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { searchPapers } from "../services/academic-search";
import { memoryStore } from "../services/memory-store";

export const searchRouter = createRouter({
  // ========================================================================
  // Create a new search session
  // ========================================================================
  createSession: publicQuery
    .input(
      z.object({
        topic: z.string().min(1).max(500),
        numStudies: z.number().min(1).max(50).default(5),
        yearFrom: z.number().min(1900).max(2100).default(2020),
        yearTo: z.number().min(1900).max(2100).default(2026),
        citationMin: z.number().min(0).default(1),
        databases: z.string().default("semantic_scholar,openalex"),
        keywords: z.string().optional(),
        inclusionCriteria: z.string().optional(),
        exclusionCriteria: z.string().optional(),
        bibFormat: z.enum(["APA", "MLA", "Chicago", "IEEE", "BibTeX"]).default("APA"),
        version: z.enum(["mvp", "v2", "v3"]).default("mvp"),
      })
    )
    .mutation(({ input }) => {
      const session = memoryStore.createSession({
        topic: input.topic,
        numStudies: input.numStudies,
        yearFrom: input.yearFrom,
        yearTo: input.yearTo,
        citationMin: input.citationMin,
        databases: input.databases,
        keywords: input.keywords,
        inclusionCriteria: input.inclusionCriteria,
        exclusionCriteria: input.exclusionCriteria,
        bibFormat: input.bibFormat,
        version: input.version,
        status: "pending",
      });

      return { sessionId: session.id };
    }),

  // ========================================================================
  // Execute search and populate papers
  // ========================================================================
  execute: publicQuery
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ input }) => {
      const session = memoryStore.getSession(input.sessionId);
      if (!session) throw new Error("Session not found");

      memoryStore.updateSession(input.sessionId, { status: "searching" });

      try {
        const dbList = session.databases.split(",").map((d) => d.trim());
        const results = await searchPapers({
          topic: session.topic,
          keywords: session.keywords || undefined,
          yearFrom: session.yearFrom,
          yearTo: session.yearTo,
          citationMin: session.citationMin,
          numStudies: session.numStudies,
          databases: dbList,
          inclusionCriteria: session.inclusionCriteria || undefined,
          exclusionCriteria: session.exclusionCriteria || undefined,
        });

        memoryStore.updateSession(input.sessionId, { status: "extracting" });

        for (const paper of results) {
          memoryStore.addPaper({
            sessionId: input.sessionId,
            externalId: paper.externalId,
            source: paper.source,
            title: paper.title,
            authors: JSON.stringify(paper.authors),
            year: paper.year,
            journal: paper.journal || null,
            volume: paper.volume || null,
            issue: paper.issue || null,
            pages: paper.pages || null,
            doi: paper.doi || null,
            url: paper.url,
            abstract: paper.abstract || null,
            citationCount: paper.citationCount,
            citationCountSource: paper.citationCountSource,
            pdfUrl: paper.pdfUrl || null,
            relevanceScore: paper.relevanceScore,
            isSelected: 1,
          });
        }

        const nextStatus = session.version === "mvp" ? "completed" : "synthesizing";
        memoryStore.updateSession(input.sessionId, { status: nextStatus });

        return {
          success: true,
          papersFound: results.length,
          sessionId: input.sessionId,
          status: nextStatus,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        memoryStore.updateSession(input.sessionId, { status: "error", errorMessage: message });
        throw new Error(`Search failed: ${message}`);
      }
    }),

  // ========================================================================
  // Get session details with papers
  // ========================================================================
  getSession: publicQuery
    .input(z.object({ sessionId: z.number() }))
    .query(({ input }) => {
      const session = memoryStore.getSession(input.sessionId);
      if (!session) throw new Error("Session not found");

      const sessionPapers = memoryStore.getPapersForSession(input.sessionId);

      return {
        session,
        papers: sessionPapers.map((p) => ({
          ...p,
          authors: p.authors ? JSON.parse(p.authors as string) : [],
        })),
      };
    }),

  // ========================================================================
  // List all sessions
  // ========================================================================
  listSessions: publicQuery.query(() => {
    return memoryStore.listSessions();
  }),

  // ========================================================================
  // Delete a session
  // ========================================================================
  deleteSession: publicQuery
    .input(z.object({ sessionId: z.number() }))
    .mutation(({ input }) => {
      memoryStore.deleteSession(input.sessionId);
      return { success: true };
    }),
});
