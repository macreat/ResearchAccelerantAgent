import {
  mysqlTable,
  serial,
  varchar,
  text,
  int,
  timestamp,
  json,
  mysqlEnum,
} from "drizzle-orm/mysql-core";

// ============================================================================
// Search Sessions - Core entity for each literature review request
// ============================================================================
export const searchSessions = mysqlTable("search_sessions", {
  id: serial("id").primaryKey(),
  topic: varchar("topic", { length: 500 }).notNull(),
  numStudies: int("num_studies").notNull().default(5),
  yearFrom: int("year_from").notNull().default(2020),
  yearTo: int("year_to").notNull().default(2026),
  citationMin: int("citation_min").notNull().default(1),
  databases: varchar("databases", { length: 255 }).notNull().default("semantic_scholar,openalex"),
  keywords: text("keywords"),
  inclusionCriteria: text("inclusion_criteria"),
  exclusionCriteria: text("exclusion_criteria"),
  bibFormat: mysqlEnum("bib_format", ["APA", "MLA", "Chicago", "IEEE", "BibTeX"]).notNull().default("APA"),
  status: mysqlEnum("status", ["pending", "searching", "extracting", "synthesizing", "drafting", "completed", "error"]).notNull().default("pending"),
  version: mysqlEnum("version", ["mvp", "v2", "v3"]).notNull().default("mvp"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================================
// Papers - Individual papers retrieved from academic APIs
// ============================================================================
export const papers = mysqlTable("papers", {
  id: serial("id").primaryKey(),
  sessionId: int("session_id").notNull(),
  externalId: varchar("external_id", { length: 255 }).notNull(),
  source: varchar("source", { length: 50 }).notNull(),
  title: text("title").notNull(),
  authors: text("authors"),
  year: int("year"),
  journal: text("journal"),
  volume: varchar("volume", { length: 50 }),
  issue: varchar("issue", { length: 50 }),
  pages: varchar("pages", { length: 50 }),
  doi: varchar("doi", { length: 255 }),
  url: text("url"),
  abstract: text("abstract"),
  methodology: text("methodology"),
  keyFindings: text("key_findings"),
  gapsAndLimitations: text("gaps_and_limitations"),
  citationCount: int("citation_count").default(0),
  citationCountSource: varchar("citation_count_source", { length: 50 }),
  pdfUrl: text("pdf_url"),
  relevanceScore: int("relevance_score"),
  isSelected: int("is_selected", { unsigned: true }).notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// Synthesis Results - Cross-study synthesis and gap analysis (V2)
// ============================================================================
export const synthesisResults = mysqlTable("synthesis_results", {
  id: serial("id").primaryKey(),
  sessionId: int("session_id").notNull(),
  methodologicalPatterns: text("methodological_patterns"),
  overarchingFindings: text("overarching_findings"),
  recurringGaps: text("recurring_gaps"),
  impactAssessment: text("impact_assessment"),
  futureDirections: text("future_directions"),
  identifiedGaps: json("identified_gaps").$type<string[]>(),
  rawSynthesis: text("raw_synthesis"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================================
// Problem Statements - Final problem statement output (V3)
// ============================================================================
export const problemStatements = mysqlTable("problem_statements", {
  id: serial("id").primaryKey(),
  sessionId: int("session_id").notNull(),
  whatIsKnown: text("what_is_known"),
  whatIsMissing: text("what_is_missing"),
  affectedStakeholders: text("affected_stakeholders"),
  consequencesOfInaction: text("consequences_of_inaction"),
  howStudyAddressesGap: text("how_study_addresses_gap"),
  selectedGapIndex: int("selected_gap_index"),
  fullStatement: text("full_statement"),
  latexOutput: text("latex_output"),
  status: mysqlEnum("status", ["draft", "review_pending", "approved", "rejected"]).notNull().default("draft"),
  humanFeedback: text("human_feedback"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================================
// LaTeX Outputs - Generated LaTeX documents
// ============================================================================
export const latexOutputs = mysqlTable("latex_outputs", {
  id: serial("id").primaryKey(),
  sessionId: int("session_id").notNull(),
  documentType: mysqlEnum("document_type", ["literature_review", "synthesis", "problem_statement", "full_pipeline"]).notNull(),
  latexContent: text("latex_content").notNull(),
  compiledPdfUrl: text("compiled_pdf_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
