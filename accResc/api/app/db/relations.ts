import { relations } from "drizzle-orm";
import { searchSessions, papers, synthesisResults, problemStatements, latexOutputs } from "./schema";

export const searchSessionsRelations = relations(searchSessions, ({ many }) => ({
  papers: many(papers),
  synthesisResults: many(synthesisResults),
  problemStatements: many(problemStatements),
  latexOutputs: many(latexOutputs),
}));

export const papersRelations = relations(papers, ({ one }) => ({
  session: one(searchSessions, {
    fields: [papers.sessionId],
    references: [searchSessions.id],
  }),
}));

export const synthesisResultsRelations = relations(synthesisResults, ({ one }) => ({
  session: one(searchSessions, {
    fields: [synthesisResults.sessionId],
    references: [searchSessions.id],
  }),
}));

export const problemStatementsRelations = relations(problemStatements, ({ one }) => ({
  session: one(searchSessions, {
    fields: [problemStatements.sessionId],
    references: [searchSessions.id],
  }),
}));

export const latexOutputsRelations = relations(latexOutputs, ({ one }) => ({
  session: one(searchSessions, {
    fields: [latexOutputs.sessionId],
    references: [searchSessions.id],
  }),
}));
