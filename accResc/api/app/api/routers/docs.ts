import { z } from "zod";
import path from "path";
import { createRouter, publicQuery } from "../middleware";
import {
  compilePdf,
  generateTexReport,
  health,
  askLocalAgent,
  deepAskAboutDocument,
  listArtifacts,
  listDocuments,
  scanDocuments,
  searchDocuments,
  compileLocalTex,
  getTexBuffer,
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
  deepAsk: publicQuery
    .input(z.object({ 
      documentId: z.string(), 
      question: z.string().min(1) 
    }))
    .mutation(({ input }) => deepAskAboutDocument(input.documentId, input.question)),
  generateTex: publicQuery
    .input(z.object({
      documentIds: z.array(z.string()).optional(),
      includeChatHistory: z.boolean().optional(),
      chatMessages: z.array(z.string()).optional(),
      title: z.string().default("Local Research Agent Document Report"),
      topic: z.string().optional(),
    }))
    .mutation(({ input }) => generateTexReport(input.documentIds || [], input.title, !!input.includeChatHistory, input.chatMessages || [], input.topic || undefined)),

  compilePdf: publicQuery
    .input(z.object({ artifactId: z.string() }))
    .mutation(({ input }) => compilePdf(input.artifactId)),
  downloadPdf: publicQuery
    .input(z.object({ artifactId: z.string() }))
    .mutation(async ({ input }) => {
      const { listArtifacts, getPdfBuffer } = await import("../services/local-docs");
      const currentArtifacts = listArtifacts();
      const artifact = currentArtifacts.find(a => a.id === input.artifactId);
      if (!artifact || !artifact.pdfPath) throw new Error("PDF not compiled or found");
      const buffer = await getPdfBuffer(artifact.pdfPath);
      return {
        filename: path.basename(artifact.pdfPath),
        data: buffer.toString("base64"),
      };
    }),
  downloadTex: publicQuery
    .input(z.object({ 
      sha256: z.string().optional(),
      artifactId: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      const { listDocuments, listArtifacts, getTexBuffer } = await import("../services/local-docs");
      let texPath: string | undefined;
      let filename: string | undefined;

      if (input.sha256) {
        const doc = listDocuments().find(d => d.sha256 === input.sha256);
        if (doc && doc.type === 'tex') {
          texPath = doc.absolutePath;
          filename = doc.fileName;
        }
      } else if (input.artifactId) {
        const artifact = listArtifacts().find(a => a.id === input.artifactId);
        if (artifact) {
          texPath = artifact.texPath;
          filename = path.basename(artifact.texPath);
        }
      }

      if (!texPath || !filename) throw new Error("TeX file not found");
      const buffer = await getTexBuffer(texPath);
      return {
        filename,
        data: buffer.toString("base64"),
      };
    }),
  compileLocalTex: publicQuery
    .input(z.object({ sha256: z.string() }))
    .mutation(({ input }) => compileLocalTex(input.sha256)),
  // New: Extract concise deep-research summary for a document
  extractDeepSummary: publicQuery
    .input(z.object({ documentId: z.string() }))
    .mutation(async ({ input }) => {
      const { extractConciseDeepSummaryForDocument } = await import('../services/local-docs');
      return extractConciseDeepSummaryForDocument(input.documentId);
    }),
  artifacts: publicQuery.query(() => listArtifacts()),
});
