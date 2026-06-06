import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { memoryStore } from "../services/memory-store";
import { synthesizePapers } from "../services/synthesis-engine";
import type { SynthesisData } from "../services/latex-generator";

export const synthesisRouter = createRouter({
  // ========================================================================
  // Run synthesis on a session's papers
  // ========================================================================
  run: publicQuery
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ input }) => {
      const session = memoryStore.getSession(input.sessionId);
      if (!session) throw new Error("Session not found");

      const sessionPapers = memoryStore.getPapersForSession(input.sessionId);
      if (sessionPapers.length === 0) throw new Error("No papers found. Run search first.");

      memoryStore.updateSession(input.sessionId, { status: "synthesizing" });

      try {
        const paperMetadata = sessionPapers.map((p) => ({
          externalId: p.externalId,
          source: p.source,
          title: p.title,
          authors: p.authors ? JSON.parse(p.authors as string) : [],
          year: p.year || 0,
          journal: p.journal || undefined,
          volume: p.volume || undefined,
          issue: p.issue || undefined,
          pages: p.pages || undefined,
          doi: p.doi || undefined,
          url: p.url || "",
          abstract: p.abstract || undefined,
          citationCount: p.citationCount || 0,
          citationCountSource: p.citationCountSource || "",
          pdfUrl: p.pdfUrl || undefined,
          relevanceScore: p.relevanceScore || 0,
        }));

        const synthesis = await synthesizePapers(paperMetadata, session.topic);

        memoryStore.createSynthesis({
          sessionId: input.sessionId,
          methodologicalPatterns: synthesis.methodologicalPatterns,
          overarchingFindings: synthesis.overarchingFindings,
          recurringGaps: synthesis.recurringGaps,
          impactAssessment: synthesis.impactAssessment,
          futureDirections: synthesis.futureDirections,
          identifiedGaps: synthesis.identifiedGaps,
          rawSynthesis: JSON.stringify(synthesis),
        });

        const nextStatus = session.version === "v3" ? "drafting" : "completed";
        memoryStore.updateSession(input.sessionId, { status: nextStatus });

        return { success: true, synthesis, status: nextStatus };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        memoryStore.updateSession(input.sessionId, { status: "error", errorMessage: message });
        throw new Error(`Synthesis failed: ${message}`);
      }
    }),

  // ========================================================================
  // Get synthesis result for a session
  // ========================================================================
  get: publicQuery
    .input(z.object({ sessionId: z.number() }))
    .query(({ input }) => {
      const result = memoryStore.getSynthesisForSession(input.sessionId);
      if (!result) return null;

      return {
        ...result,
        identifiedGaps: result.identifiedGaps || [],
      };
    }),

  // ========================================================================
  // Update synthesis (human feedback)
  // ========================================================================
  update: publicQuery
    .input(
      z.object({
        sessionId: z.number(),
        methodologicalPatterns: z.string().optional(),
        overarchingFindings: z.string().optional(),
        recurringGaps: z.string().optional(),
        impactAssessment: z.string().optional(),
        futureDirections: z.string().optional(),
        identifiedGaps: z.array(z.string()).optional(),
      })
    )
    .mutation(({ input }) => {
      const updateData: Partial<SynthesisData> = {};
      if (input.methodologicalPatterns !== undefined) updateData.methodologicalPatterns = input.methodologicalPatterns;
      if (input.overarchingFindings !== undefined) updateData.overarchingFindings = input.overarchingFindings;
      if (input.recurringGaps !== undefined) updateData.recurringGaps = input.recurringGaps;
      if (input.impactAssessment !== undefined) updateData.impactAssessment = input.impactAssessment;
      if (input.futureDirections !== undefined) updateData.futureDirections = input.futureDirections;
      if (input.identifiedGaps !== undefined) updateData.identifiedGaps = input.identifiedGaps;

      memoryStore.updateSynthesis(input.sessionId, updateData);
      return { success: true };
    }),
});
