import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import {
  compilePdf,
  generateTexReport,
  health,
  askLocalAgent,
  listArtifacts,
  listDocuments,
  scanDocuments,
  searchDocuments,
} from "../services/local-docs";

export const docsRouter = createRouter({
  health: publicQuery.query(() => health()),
  scan: publicQuery.mutation(() => scanDocuments()),
  list: publicQuery.query(() => listDocuments()),
  search: publicQuery
    .input(z.object({ query: z.string().default("") }))
    .query(({ input }) => searchDocuments(input.query)),
  ask: publicQuery
    .input(z.object({ question: z.string().min(1) }))
    .mutation(({ input }) => askLocalAgent(input.question)),
  generateTex: publicQuery
    .input(z.object({
      documentIds: z.array(z.string()).min(1),
      title: z.string().default("Local Research Agent Document Report"),
    }))
    .mutation(({ input }) => generateTexReport(input.documentIds, input.title)),
  compilePdf: publicQuery
    .input(z.object({ artifactId: z.string() }))
    .mutation(({ input }) => compilePdf(input.artifactId)),
  artifacts: publicQuery.query(() => listArtifacts()),
});
