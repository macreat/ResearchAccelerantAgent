/**
 * LaTeX Generator Service
 * Produces publication-ready LaTeX output for literature reviews,
 * synthesis reports, and problem statements.
 */

import type { PaperMetadata } from "./academic-search";
export type { PaperMetadata } from "./academic-search";

// ============================================================================
// Types
// ============================================================================
export interface SynthesisData {
  methodologicalPatterns: string;
  overarchingFindings: string;
  recurringGaps: string;
  impactAssessment: string;
  futureDirections: string;
  identifiedGaps: string[];
}

export interface ProblemStatementData {
  whatIsKnown: string;
  whatIsMissing: string;
  affectedStakeholders: string;
  consequencesOfInaction: string;
  howStudyAddressesGap: string;
  selectedGapIndex: number;
  fullStatement: string;
}

export interface BibFormat {
  format: "APA" | "MLA" | "Chicago" | "IEEE" | "BibTeX";
}

// ============================================================================
// Citation Formatters
// ============================================================================
function formatCitationAPA(paper: PaperMetadata): string {
  const authors = paper.authors.join(", ");
  const journal = paper.journal ? `\textit{${paper.journal}}` : "";
  const volIssue = paper.volume ? `, ${paper.volume}` : "";
  const pages = paper.pages ? `, ${paper.pages}` : "";
  return `${authors} (${paper.year}). ${paper.title}. ${journal}${volIssue}${pages}. https://doi.org/${paper.doi || "N/A"}`;
}

function formatCitationMLA(paper: PaperMetadata): string {
  const authors = paper.authors.join(", ");
  const journal = paper.journal ? `\\textit{${paper.journal}}` : "";
  const vol = paper.volume || "";
  const pages = paper.pages || "";
  return `${authors}. "${paper.title}." ${journal}, vol. ${vol}, ${paper.year}, pp. ${pages}.`;
}

function formatCitationIEEE(paper: PaperMetadata): string {
  const authors = paper.authors.join(", ");
  return `[${authors}, \"${paper.title},\" ${paper.journal || ""}, vol. ${paper.volume || ""}, pp. ${paper.pages || ""}, ${paper.year}.]`;
}

function formatCitation(paper: PaperMetadata, format: BibFormat["format"]): string {
  switch (format) {
    case "MLA":
      return formatCitationMLA(paper);
    case "IEEE":
      return formatCitationIEEE(paper);
    case "BibTeX":
      return generateBibTeXEntry(paper);
    case "APA":
    default:
      return formatCitationAPA(paper);
  }
}

function generateBibTeXEntry(paper: PaperMetadata): string {
  const key = paper.authors[0]?.split(" ").pop()?.toLowerCase() || "unknown";
  const authors = paper.authors.join(" and ");
  return `@article{${key}${paper.year},
  title={${paper.title}},
  author={${authors}},
  journal={${paper.journal || ""}},
  volume={${paper.volume || ""}},
  pages={${paper.pages || ""}},
  year={${paper.year}},
  doi={${paper.doi || ""}}
}`;
}

// ============================================================================
// LaTeX Document Assembly
// ============================================================================
function latexPreamble(title: string): string {
  // Updated preamble based on user-provided stable template that compiles reliably
  return `\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage[english]{babel}
\\usepackage[margin=1in]{geometry}
\\usepackage{amsmath, amssymb, amsfonts}
\\usepackage{graphicx}
\\usepackage[most]{tcolorbox}
\\usepackage{enumitem}
\\usepackage{booktabs}
\\usepackage{array}
\\usepackage{fancyhdr}
\\usepackage{xcolor}
\\usepackage{titlesec}
\\usepackage{tocloft}
\\usepackage{float}
\\usepackage{longtable}

% --- Custom Colors ---
\\definecolor{unalblue}{RGB}{0, 56, 101}
\\definecolor{boxbg}{RGB}{245, 248, 250}

% --- Custom TColorBox Environments ---
\\newtcolorbox{resultbox}[1][]{
    colback=boxbg,
    colframe=unalblue,
    title=#1,
    fonttitle=\\bfseries
}
\\newtcolorbox{gapbox}[1][]{
    colback=gray!5,
    colframe=black!30,
    boxrule=0.3pt,
    title=\\textit{#1}
}

% --- Header and Footer ---
\\pagestyle{fancy}
\\fancyhf{}
\\lhead{\\small \\textit{Research Tool Integration Report}}
\\rhead{\\small \\thepage}
\\renewcommand{\\headrulewidth}{0.4pt}

% --- Section Styling ---
\\titleformat{\\section}{\\color{unalblue}\\normalfont\\Large\\bfseries}{\\thesection}{1em}{}
\\titleformat{\\subsection}{\\color{unalblue}\\normalfont\\large\\bfseries}{\\thesubsection}{1em}{}

% --- TOC Styling via tocloft ---
\\renewcommand{\\cfttoctitlefont}{\\color{unalblue}\\Large\\bfseries}
\\renewcommand{\\contentsname}{0 \\quad Contents}
\\renewcommand{\\cftsecfont}{\\bfseries}
\\renewcommand{\\cftsecpagefont}{\\bfseries}
\\renewcommand{\\cftsecdotsep}{\\cftdotsep}
\\renewcommand{\\cftsubsecfont}{\\normalfont}

% --- Custom Command for HR ---
\\newcommand{\\hr}{\\rule{\\linewidth}{0.5mm}}

% --- Metadata ---
\\newcommand{\\projecttitle}{${title}}
\\newcommand{\\candidate}{Generated by Research Accelerant Agent}
\\newcommand{\\supervisor}{Generated by Research Accelerant Agent}
\\newcommand{\\institution}{Local Research Agent}
\\newcommand{\\department}{Research System}
\\newcommand{\\dateprep}{\\today}

\\usepackage[hidelinks]{hyperref}

\\begin{document}

% Title block (centered)
\\thispagestyle{empty}
\\begin{center}
    \\vspace*{0.5cm}
    {\\large \\textbf{Tool Research Proposal}}\\\\[0.5cm]
    \\hr\\\\[0.4cm]
    {\\huge \\bfseries \\color{unalblue} \\\projecttitle}\\\\[0.4cm]
    \\hr\\\\[1.2cm]

    \\begin{tabular}{rl}
        \\textbf{Candidate:} & \\candidate \\\\ 
        \\textbf{Supervisor:} & \\supervisor \\\\ 
        \\textbf{Department:} & \\department \\\\ 
        \\textbf{Institution:} & \\institution \\\\ 
        \\textbf{Date:} & \\dateprep
    \\end{tabular}
    \\vspace{1.2cm}

    \\begin{tcolorbox}[colback=boxbg, colframe=unalblue, title=Abstract, fonttitle=\\bfseries]
        This report was generated by the Research Accelerant local agent. It synthesizes indexed documents and user-provided chat history into a concise LaTeX report suitable for PDF compilation.
    \\end{tcolorbox}
\\end{center}
\\vfill
\\clearpage

% --- PAGE 2: Table of Contents ---
\\pagenumbering{arabic}
\\tableofcontents
\\clearpage

`;
}

// ============================================================================
// Literature Review Document (MVP)
// ============================================================================
export function generateLiteratureReviewLaTeX(
  papers: PaperMetadata[],
  topic: string,
  yearFrom: number,
  yearTo: number,
  bibFormat: BibFormat["format"] = "APA",
  includePreamble: boolean = true
): string {
  const parts: string[] = [];

  if (includePreamble) parts.push(latexPreamble(`Literature Review: ${topic}`));

  // Search parameters summary
  parts.push(`
\\begin{resultbox}[Search Parameters]
\\begin{itemize}[leftmargin=*]
    \\item \\textbf{Topic:} ${topic}
    \\item \\textbf{Year Range:} ${yearFrom}--${yearTo}
    \\item \\textbf{Studies Retrieved:} ${papers.length}
    \\item \\textbf{Citation Format:} ${bibFormat}
\\end{itemize}
\\end{resultbox}

\\vspace{1em}`);

  // Individual studies
  parts.push(`\\section*{Reviewed Studies}`);

  papers.forEach((paper, index) => {
    const citation = formatCitation(paper, bibFormat);

    parts.push(`
\\textbf{${index + 1}. ${paper.title}}

\\textbf{Full Citation:} ${citation}

\\begin{resultbox}[Study Details]
\\begin{itemize}[leftmargin=*]
    \\item \\textbf{Authors:} ${paper.authors.join(", ")}
    \\item \\textbf{Year:} ${paper.year}
    \\item \\textbf{Journal:} ${paper.journal || "N/A"}
    ${paper.volume ? `    \\item \\textbf{Volume:} ${paper.volume}` : ""}
    ${paper.issue ? `    \\item \\textbf{Issue:} ${paper.issue}` : ""}
    ${paper.pages ? `    \\item \\textbf{Pages:} ${paper.pages}` : ""}
    \\item \\textbf{DOI:} \\href{https://doi.org/${paper.doi || ""}}{${paper.doi || "N/A"}}
    \\item \\textbf{Citation Count:} ${paper.citationCount} (${paper.citationCountSource})
    \\item \\textbf{Access:} \\href{${paper.url}}{${paper.source === "openalex" ? "OpenAlex" : "Semantic Scholar"}}
\\end{itemize}
\\end{resultbox}

\\textbf{Abstract:} ${paper.abstract || "Abstract not available."}\\par\\vspace{0.5em}
`);
  });

  // Summary statistics table
  if (papers.length > 0) {
    const avgCitations = Math.round(papers.reduce((s, p) => s + p.citationCount, 0) / papers.length);
    const yearRange = papers.map((p) => p.year);
    const minYear = Math.min(...yearRange);
    const maxYear = Math.max(...yearRange);

    parts.push(`
\\vspace{1em}
\\section*{Summary Statistics}

\\begin{center}
\\begin{tabular}{lc}
\\toprule
\\textbf{Metric} & \\textbf{Value} \\\\
\\midrule
Total Studies Reviewed & ${papers.length} \\\\
Average Citations per Study & ${avgCitations} \\\\
Publication Year Range & ${minYear}--${maxYear} \\\\
Studies with Open Access PDF & ${papers.filter((p) => p.pdfUrl).length} \\\\
\\bottomrule
\\end{tabular}
\\end{center}`);
  }

  if (includePreamble) {
    parts.push(`
\\vfill
\\begin{center}
\\textit{Document generated by Research Accelerant Agent on \\today.}
\\end{center}

\\end{document}`);
  }

  return parts.join("\n\n");
}

// ============================================================================
// Synthesis Document (V2)
// ============================================================================
export function generateSynthesisLaTeX(
  papers: PaperMetadata[],
  synthesis: SynthesisData,
  topic: string,
  _bibFormat: BibFormat["format"] = "APA",
  includePreamble: boolean = true
): string {
  const parts: string[] = [];

  if (includePreamble) parts.push(latexPreamble(`Cross-Study Synthesis: ${topic}`));

  // Papers summary table
  parts.push(`
\\section*{Studies Included in Synthesis}

\\begin{longtable}{p{5cm}cc}
\\toprule
\\textbf{Study} & \\textbf{Year} & \\textbf{Citations} \\\\
\\midrule
\\endhead
${papers
  .map((p) => `${p.title.substring(0, 50)}${p.title.length > 50 ? "..." : ""} & ${p.year} & ${p.citationCount} \\\\`)
  .join("\n")}
\\bottomrule
\\end{longtable}

\\vspace{1em}`);

  // Methodological Patterns
  parts.push(`
\\section*{Methodological Patterns}

${synthesis.methodologicalPatterns || "No methodological patterns identified."}

\\vspace{1em}`);

  // Overarching Findings
  parts.push(`
\\section*{Overarching Findings and Trends}

${synthesis.overarchingFindings || "No overarching findings identified."}

\\vspace{1em}`);

  // Recurring Gaps
  parts.push(`
\\section*{Recurring Gaps and Limitations}

${synthesis.recurringGaps || "No recurring gaps identified."}

\\vspace{0.5em}`);

  // Identified Gaps boxes
  if (synthesis.identifiedGaps && synthesis.identifiedGaps.length > 0) {
    synthesis.identifiedGaps.forEach((gap, i) => {
      parts.push(`
\\begin{gapbox}[Gap ${i + 1}]
${gap}
\\end{gapbox}

\\vspace{0.3em}`);
    });
  }

  // Impact Assessment
  parts.push(`
\\vspace{1em}
\\section*{Impact Assessment}

${synthesis.impactAssessment || "No impact assessment available."}

\\vspace{1em}`);

  // Future Directions
  parts.push(`
\\section*{Future Research Directions}

${synthesis.futureDirections || "No future directions identified."}

\\vspace{1em}`);

  if (includePreamble) {
    parts.push(`
\\vfill
\\begin{center}
\\textit{Synthesis generated by Research Accelerant Agent on \\today.}
\\end{center}

\\end{document}`);
  }

  return parts.join("\n\n");
}

// ============================================================================
// Problem Statement Document (V3)
// ============================================================================
export function generateProblemStatementLaTeX(
  ps: ProblemStatementData,
  topic: string,
  selectedGap?: string,
  includePreamble: boolean = true
): string {
  const parts: string[] = [];

  if (includePreamble) parts.push(latexPreamble(`Problem Statement: ${topic}`));

  parts.push(`
\\begin{resultbox}[Definition]
In the context of a research proposal, a problem statement is a concise, clear, and evidence-based description of a specific \\textbf{researchable} issue, a \\textbf{demonstrable} gap in knowledge, or a \\textbf{measurable} real-world challenge that your research is \\textbf{designed to solve}.
\\end{resultbox}

\\vspace{1em}

\\section*{Structured Problem Statement}

\\subsection*{1. What is Known}
${ps.whatIsKnown || "[To be completed]"}

\\vspace{0.5em}

\\subsection*{2. What is Missing}
${ps.whatIsMissing || selectedGap || "[To be completed]"}

\\vspace{0.5em}

\\subsection*{3. Affected Stakeholders}
${ps.affectedStakeholders || "[To be completed]"}

\\vspace{0.5em}

\\subsection*{4. Consequences of Inaction}
${ps.consequencesOfInaction || "[To be completed]"}

\\vspace{0.5em}

\\subsection*{5. How the Study Addresses the Gap}
${ps.howStudyAddressesGap || "[To be completed]"}

\\vspace{1em}

\\begin{resultbox}[Full Problem Statement]
${ps.fullStatement || "[Draft your full problem statement here by synthesizing the above components.]"}
\\end{resultbox}

\\vspace{1em}

\\section*{Validation Checklist}

\\begin{itemize}[leftmargin=*, label=$\\square$]
    \\item Is the problem \\textbf{researchable}? (Can it be investigated through empirical methods?)
    \\item Is the gap \\textbf{demonstrable}? (Can you cite evidence that it exists?)
    \\item Is the challenge \\textbf{measurable}? (Can outcomes be quantified or assessed?)
    \\item Are \\textbf{stakeholders} clearly identified?
    \\item Are \\textbf{consequences of inaction} articulated?
    \\item Does the statement tell reviewers \\textbf{why}, \\textbf{what}, and \\textbf{how}?
\\end{itemize}`);

  if (includePreamble) {
    parts.push(`
\\vfill
\\begin{center}
\\textit{Problem statement generated by Research Accelerant Agent on \\today.}
\\end{center}

\\end{document}`);
  }

  return parts.join("\n\n");
}

// ============================================================================
// Full Pipeline Document (All V1+V2+V3 combined)
// ============================================================================
export function generateFullPipelineLaTeX(
  papers: PaperMetadata[],
  synthesis: SynthesisData,
  ps: ProblemStatementData,
  topic: string,
  yearFrom: number,
  yearTo: number,
  bibFormat: BibFormat["format"] = "APA"
): string {
  const parts: string[] = [];

  // Single-document composition: add preamble once and include fragments
  parts.push(latexPreamble(`Research Proposal Foundation: ${topic}`));

  parts.push(`\\part*{Part I: Literature Review}\\addcontentsline{toc}{part}{Part I: Literature Review}`);
  parts.push(generateLiteratureReviewLaTeX(papers, topic, yearFrom, yearTo, bibFormat, false));

  // Include synthesis
  parts.push(`\\newpage`);
  parts.push(`\\part*{Part II: Cross-Study Synthesis}\\addcontentsline{toc}{part}{Part II: Cross-Study Synthesis}`);
  parts.push(generateSynthesisLaTeX(papers, synthesis, topic, bibFormat, false));

  // Include problem statement
  parts.push(`\\newpage`);
  parts.push(`\\part*{Part III: Problem Statement}\\addcontentsline{toc}{part}{Part III: Problem Statement}`);
  parts.push(generateProblemStatementLaTeX(ps, topic, synthesis.identifiedGaps?.[ps.selectedGapIndex || 0], false));

  parts.push(`\\vfill\\begin{center}\\textit{Research proposal generated by Research Accelerant Agent on \\today.}\\end{center}\\end{document}`);

  return parts.join("\n\n");
}

// ============================================================================
// Enhanced Professional Preamble (with more packages)
// ============================================================================
function enhancedLatexPreamble(title: string, author?: string): string {
  return `\\documentclass[12pt,a4paper]{article}

% === Encoding & Fonts ===
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{graphicx}
\\usepackage{geometry}
\\usepackage{setspace}

% === Formatting ===
\\usepackage{titlesec}
\\usepackage{fancyhdr}
\\usepackage{listings}
\\usepackage{xcolor}
\\usepackage{amsmath}
\\usepackage{amssymb}
\\usepackage{microtype} % Better typography

% === Tables & Figures ===
\\usepackage{booktabs}
\\usepackage{longtable}
\\usepackage{array}
\\usepackage{tabularx}
\\usepackage{float}

% === Advanced Elements ===
\\usepackage[most]{tcolorbox}
\\usepackage{wrapfig}

% === Hyperref (load last, after most packages) ===
\\usepackage{hyperref}

% === Page Setup ===
\\geometry{margin=1in, headheight=15pt}
\\setstretch{1.15}

% === Custom Colors ===
\\definecolor{titleblue}{RGB}{0, 51, 102}
\\definecolor{sectionblue}{RGB}{41, 128, 185}
\\definecolor{lightgray}{RGB}{245, 245, 245}
\\definecolor{darkgray}{RGB}{100, 100, 100}

% === Section Formatting ===
\\titleformat{\\section}{\\large\\bfseries\\color{sectionblue}}{\\thesection.}{1em}{}
\\titleformat{\\subsection}{\\normalsize\\bfseries\\color{sectionblue}}{\\thesubsection.}{1em}{}

% === Header/Footer ===
\\pagestyle{fancy}
\\fancyhf{}
\\fancyhead[L]{\\textit{${title.substring(0, 50)}${title.length > 50 ? "..." : ""}}}
\\fancyhead[R]{\\thepage}
\\fancyfoot[C]{\\small Generated by Research Accelerant Agent on \\today}

% === Hypersetup ===
\\hypersetup{
    colorlinks=true,
    linkcolor=sectionblue,
    urlcolor=sectionblue,
    citecolor=sectionblue
}

% === Title Block ===
\\title{\\vspace{-2cm}\\color{titleblue}\\Huge\\textbf{${title}}}
\\author{\\large ${author || "Generated by Research Accelerant Agent"}}
\\date{\\today}

\\begin{document}

\\maketitle
\\thispagestyle{empty}
\\vfill
\\begin{abstract}
This report provides a systematic architectural and methodological analysis based on peer-reviewed research and local documentation. It synthesizes findings from ${title} to provide actionable insights for system design and implementation.
\\end{abstract}
\\newpage

\\tableofcontents
\\newpage`;
}

// ============================================================================
// Methodological Report Template (Based on SAAM)
// ============================================================================
export function generateMethodologicalReportLaTeX(
  topic: string,
  synthesis: SynthesisData,
  papers: PaperMetadata[],
  author?: string
): string {
  const parts: string[] = [];

  parts.push(enhancedLatexPreamble(`Methodological Analysis: ${topic}`, author));

  parts.push(`
\\section{Executive Summary}
This report presents a comprehensive methodological analysis of the research landscape on \\textbf{${topic}}. Through systematic evaluation of ${papers.length} peer-reviewed studies spanning ${papers.length > 0 ? Math.min(...papers.map(p => p.year)) : "N/A"} to ${papers.length > 0 ? Math.max(...papers.map(p => p.year)) : "N/A"}, we identify dominant research paradigms, methodological strengths, and critical gaps requiring future investigation.

\\section{Research Scope and Context}
\\subsection{Topic Definition}
\\textit{${topic}} encompasses the body of empirical research, theoretical frameworks, and practical applications identified through systematic literature search using major academic databases including Semantic Scholar, OpenAlex, and Google Scholar.

\\subsection{Study Selection Criteria}
\\begin{itemize}
    \\item Publication date range: ${papers.length > 0 ? Math.min(...papers.map(p => p.year)) : "N/A"}--${papers.length > 0 ? Math.max(...papers.map(p => p.year)) : "N/A"}
    \\item Source databases: Semantic Scholar, OpenAlex, Google Scholar (SerpAPI)
    \\item Total studies reviewed: ${papers.length}
    \\item Peer-reviewed articles and conference proceedings
\\end{itemize}

\\section{Methodological Patterns}
${synthesis.methodologicalPatterns || "No specific methodological patterns identified from the reviewed literature."}

\\section{Research Design Taxonomy}
The reviewed studies employ diverse methodological approaches, reflecting the multidisciplinary nature of research in this domain. Key design categories identified include:

\\begin{itemize}
    \\item \\textbf{Quantitative experimental designs:} Focused on measurable outcomes and statistical significance.
    \\item \\textbf{Qualitative case studies:} In-depth investigation of specific instances or implementations.
    \\item \\textbf{Mixed-methods triangulation:} Combining multiple data sources for validated insights.
    \\item \\textbf{Systematic reviews and meta-analyses:} Synthesizing existing body of knowledge.
\\end{itemize}

\\section{Overarching Findings and Trends}
${synthesis.overarchingFindings || "No overarching findings identified in this iteration."}

\\section{Recurring Gaps and Limitations}
${synthesis.recurringGaps || "No recurring gaps identified."}

\\section{Impact and Citation Analysis}
${synthesis.impactAssessment || "Impact assessment based on citation metrics and venue prestige indicates a growing interest in this domain."}

\\section{Future Research Directions}
${synthesis.futureDirections || "Future research should focus on addressing the identified gaps and scaling the current methodologies."}

\\section{Conclusion}
This methodological analysis reveals both the maturity of research in ${topic} and the opportunities for novel contributions. Researchers entering this domain should consider the identified methodological gaps and build upon existing frameworks with innovative approaches.

\\end{document}`);

  return parts.join("\n\n");
}

// ============================================================================
// Architecture & Design Report Template
// ============================================================================
export function generateArchitectureReportLaTeX(
  systemName: string,
  papers: PaperMetadata[],
  synthesis: SynthesisData,
  author?: string
): string {
  const parts: string[] = [];

  parts.push(enhancedLatexPreamble(`Architecture Analysis Report: ${systemName}`, author));

  parts.push(`
\\section{Introduction}
This document presents a comprehensive architecture analysis of \\textbf{${systemName}}, informed by systematic review of ${papers.length} related research studies. The analysis employs architectural evaluation methods to assess system design against critical quality attributes including performance, scalability, maintainability, and reliability.

\\section{System Overview}
\\subsection{Core Objectives}
The primary goal of the ${systemName} architecture is to provide a robust, scalable, and extensible foundation for research acceleration. Key objectives include:
\\begin{itemize}
    \\item \\textbf{Efficiency:} High-performance processing and real-time analysis.
    \\item \\textbf{Scalability:} Scalable distributed architecture to handle growing datasets.
    \\item \\textbf{Maintainability:} Modifiable and extensible design through modularity.
    \\item \\textbf{Interoperability:} Cross-platform compatibility and standardized APIs.
\\end{itemize}

\\section{Architectural Patterns}
\\subsection{Modular System Design}
The system adopts a modular pattern enabling independent scaling and deployment of functional components. This alignment with modern microservices principles ensures that individual modules (e.g., search, extraction, synthesis) can evolve independently.

\\subsection{Key Functional Layers}
\\begin{enumerate}
    \\item \\textbf{Data Acquisition:} Ingestion layer for external APIs and local documents.
    \\item \\textbf{Processing Layer:} Text extraction, normalization, and embedding generation.
    \\item \\textbf{Inference Engine:} LLM-driven analysis and synthesis.
    \\item \\textbf{Output Generation:} Structured LaTeX and PDF production.
\\end{enumerate}

\\section{Quality Attributes & Analysis}
\\subsection{Performance and Latency}
The architecture is designed for low-latency retrieval, leveraging efficient indexing and optimized API calls. Target metrics include sub-second metadata retrieval and efficient chunk-based PDF analysis.

\\subsection{Reliability and Fault Tolerance}
Reliability is achieved through fallback mechanisms (e.g., SerpAPI keyword-to-topic fallback) and robust error handling across all service layers.

\\section{Research Evidence and Synthesis}
\\subsection{Literature Support}
The architectural decisions are informed by research findings from ${papers.length} studies covering ${papers.length > 0 ? Math.min(...papers.map(p => p.year)) : "N/A"}--${papers.length > 0 ? Math.max(...papers.map(p => p.year)) : "N/A"}.

\\subsection{Key Findings from Literature}
${synthesis.overarchingFindings || "Synthesis of the current literature suggests a trend towards automated research pipelines and LLM-integrated discovery tools."}

\\section{Known Limitations and Gaps}
${synthesis.recurringGaps || "Identified gaps include the need for more specialized datasets for niche technical domains."}

\\section{Recommendations}
\\subsection{Strategic Implementation Path}
\\begin{itemize}
    \\item \\textbf{Phase 1:} Enhance extraction accuracy for complex multi-column PDFs.
    \\item \\textbf{Phase 2:} Integrate more specialized academic databases (e.g., IEEE Xplore).
    \\item \\textbf{Phase 3:} Implement advanced cross-document citation graph analysis.
\\end{itemize}

\\section{Conclusion}
The ${systemName} architecture aligns with contemporary best practices in distributed research systems. Continuous evaluation against quality attributes and adaptation to emerging LLM capabilities will ensure sustained research acceleration.

\\end{document}`);

  return parts.join("\n\n");
}
