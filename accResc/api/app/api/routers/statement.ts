import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { memoryStore } from "../services/memory-store";
import { draftProblemStatement } from "../services/synthesis-engine";

export const statementRouter = createRouter({
  draft: publicQuery
    .input(
      z.object({
        sessionId: z.number(),
        selectedGapIndex: z.number().min(0).default(0),
      })
    )
    .mutation(async ({ input }) => {
      const session = memoryStore.getSession(input.sessionId);
      if (!session) throw new Error("Session not found");

      const synResult = memoryStore.getSynthesisForSession(input.sessionId);
      if (!synResult) throw new Error("No synthesis found. Run synthesis first.");

      const synthesis = {
        methodologicalPatterns: synResult.methodologicalPatterns || "",
        overarchingFindings: synResult.overarchingFindings || "",
        recurringGaps: synResult.recurringGaps || "",
        impactAssessment: synResult.impactAssessment || "",
        futureDirections: synResult.futureDirections || "",
        identifiedGaps: (synResult.identifiedGaps as string[]) || [],
      };

      const ps = await draftProblemStatement(synthesis, input.selectedGapIndex, session.topic);

      const existing = memoryStore.getProblemStatementForSession(input.sessionId);

      if (existing) {
        memoryStore.updateProblemStatement(input.sessionId, { ...ps });
      } else {
        memoryStore.createProblemStatement({
          sessionId: input.sessionId,
          ...ps,
          latexOutput: null,
          status: "draft",
          humanFeedback: null,
        });
      }

      memoryStore.updateSession(input.sessionId, { status: "completed" });

      return { success: true, problemStatement: ps };
    }),

  get: publicQuery
    .input(z.object({ sessionId: z.number() }))
    .query(({ input }) => {
      return memoryStore.getProblemStatementForSession(input.sessionId) || null;
    }),

  update: publicQuery
    .input(
      z.object({
        sessionId: z.number(),
        whatIsKnown: z.string().optional(),
        whatIsMissing: z.string().optional(),
        affectedStakeholders: z.string().optional(),
        consequencesOfInaction: z.string().optional(),
        howStudyAddressesGap: z.string().optional(),
        fullStatement: z.string().optional(),
        status: z.enum(["draft", "review_pending", "approved", "rejected"]).optional(),
        humanFeedback: z.string().optional(),
      })
    )
    .mutation(({ input }) => {
      const updateData: Record<string, unknown> = {};
      if (input.whatIsKnown !== undefined) updateData.whatIsKnown = input.whatIsKnown;
      if (input.whatIsMissing !== undefined) updateData.whatIsMissing = input.whatIsMissing;
      if (input.affectedStakeholders !== undefined) updateData.affectedStakeholders = input.affectedStakeholders;
      if (input.consequencesOfInaction !== undefined) updateData.consequencesOfInaction = input.consequencesOfInaction;
      if (input.howStudyAddressesGap !== undefined) updateData.howStudyAddressesGap = input.howStudyAddressesGap;
      if (input.fullStatement !== undefined) updateData.fullStatement = input.fullStatement;
      if (input.status !== undefined) updateData.status = input.status;
      if (input.humanFeedback !== undefined) updateData.humanFeedback = input.humanFeedback;

      memoryStore.updateProblemStatement(input.sessionId, updateData);
      return { success: true };
    }),

  approve: publicQuery
    .input(z.object({ sessionId: z.number(), feedback: z.string().optional() }))
    .mutation(({ input }) => {
      memoryStore.updateProblemStatement(input.sessionId, {
        status: "approved",
        humanFeedback: input.feedback || null,
      });
      return { success: true };
    }),

  reject: publicQuery
    .input(z.object({ sessionId: z.number(), feedback: z.string() }))
    .mutation(({ input }) => {
      memoryStore.updateProblemStatement(input.sessionId, {
        status: "rejected",
        humanFeedback: input.feedback,
      });
      return { success: true };
    }),
});
