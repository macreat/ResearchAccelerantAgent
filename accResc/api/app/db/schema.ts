import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  timestamp,
  json,
  pgEnum,
  index,
  vector,
} from "drizzle-orm/pg-core";

export const bibFormatEnum = pgEnum("bib_format", ["APA", "MLA", "Chicago", "IEEE", "BibTeX"]);
export const sessionStatusEnum = pgEnum("session_status", ["pending", "searching", "extracting", "synthesizing", "drafting", "completed", "error"]);
export const versionEnum = pgEnum("version", ["mvp", "v2", "v3"]);
export const problemStatusEnum = pgEnum("problem_status", ["draft", "review_pending", "approved", "rejected"]);
export const documentTypeEnum = pgEnum("document_type", ["literature_review", "synthesis", "problem_statement", "full_pipeline", "local_docs_report"]);

export const searchSessions = pgTable("search_sessions", {
  id: serial("id").primaryKey(),
  topic: varchar("topic", { length: 500 }).notNull(),
  numStudies: integer("num_studies").notNull().default(5),
  yearFrom: integer("year_from").notNull().default(2020),
  yearTo: integer("year_to").notNull().default(2026),
  citationMin: integer("citation_min").notNull().default(1),
  databases: varchar("databases", { length: 255 }).notNull().default("semantic_scholar,openalex"),
  keywords: text("keywords"),
  inclusionCriteria: text("inclusion_criteria"),
  exclusionCriteria: text("exclusion_criteria"),
  bibFormat: bibFormatEnum("bib_format").notNull().default("APA"),
  status: sessionStatusEnum("status").notNull().default("pending"),
  version: versionEnum("version").notNull().default("mvp"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const papers = pgTable("papers", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => searchSessions.id, { onDelete: "cascade" }),
  externalId: varchar("external_id", { length: 255 }).notNull(),
  source: varchar("source", { length: 50 }).notNull(),
  title: text("title").notNull(),
  authors: text("authors"),
  year: integer("year"),
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
  citationCount: integer("citation_count").default(0),
  citationCountSource: varchar("citation_count_source", { length: 50 }),
  pdfUrl: text("pdf_url"),
  relevanceScore: integer("relevance_score"),
  isSelected: integer("is_selected").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  sessionIdx: index("papers_session_idx").on(table.sessionId),
  externalIdx: index("papers_external_idx").on(table.externalId),
}));

export const synthesisResults = pgTable("synthesis_results", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => searchSessions.id, { onDelete: "cascade" }),
  methodologicalPatterns: text("methodological_patterns"),
  overarchingFindings: text("overarching_findings"),
  recurringGaps: text("recurring_gaps"),
  impactAssessment: text("impact_assessment"),
  futureDirections: text("future_directions"),
  identifiedGaps: json("identified_gaps").$type<string[]>(),
  rawSynthesis: text("raw_synthesis"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  sessionIdx: index("synthesis_session_idx").on(table.sessionId),
}));

export const problemStatements = pgTable("problem_statements", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => searchSessions.id, { onDelete: "cascade" }),
  whatIsKnown: text("what_is_known"),
  whatIsMissing: text("what_is_missing"),
  affectedStakeholders: text("affected_stakeholders"),
  consequencesOfInaction: text("consequences_of_inaction"),
  howStudyAddressesGap: text("how_study_addresses_gap"),
  selectedGapIndex: integer("selected_gap_index"),
  fullStatement: text("full_statement"),
  latexOutput: text("latex_output"),
  status: problemStatusEnum("status").notNull().default("draft"),
  humanFeedback: text("human_feedback"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  sessionIdx: index("problem_session_idx").on(table.sessionId),
}));

export const latexOutputs = pgTable("latex_outputs", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => searchSessions.id, { onDelete: "cascade" }),
  documentType: documentTypeEnum("document_type").notNull(),
  latexContent: text("latex_content").notNull(),
  compiledPdfUrl: text("compiled_pdf_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  sessionIdx: index("latex_session_idx").on(table.sessionId),
}));

export const localDocuments = pgTable("local_documents", {
  id: serial("id").primaryKey(),
  fileName: varchar("file_name", { length: 500 }).notNull(),
  relativePath: text("relative_path").notNull(),
  absolutePath: text("absolute_path").notNull(),
  sha256: varchar("sha256", { length: 64 }).notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull().default("application/pdf"),
  title: text("title"),
  extractedText: text("extracted_text"),
  embedding: vector("embedding", { dimensions: 1536 }),
  indexedAt: timestamp("indexed_at").notNull().defaultNow(),
}, (table) => ({
  shaIdx: index("local_documents_sha_idx").on(table.sha256),
  fileIdx: index("local_documents_file_idx").on(table.fileName),
}));
