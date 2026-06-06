import { createRouter, publicQuery } from "./middleware";
import { searchRouter } from "./routers/search";
import { synthesisRouter } from "./routers/synthesis";
import { latexRouter } from "./routers/latex";
import { statementRouter } from "./routers/statement";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),

  // MVP: Search & Format
  search: searchRouter,

  // V2: Synthesis Agent
  synthesis: synthesisRouter,

  // V3: Problem Statement Generator
  statement: statementRouter,

  // LaTeX Output Generator (all versions)
  latex: latexRouter,
});

export type AppRouter = typeof appRouter;
