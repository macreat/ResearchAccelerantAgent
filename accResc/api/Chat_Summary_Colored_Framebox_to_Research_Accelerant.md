# Chat Summary: Colored Framebox Prompt → Research Accelerant Agent

## 1. Initial Request: Literature Review Prompt Template Refinement

**User Prompt:** Proofread and refine a prompt template for producing structured literature reviews.

**Original Template Issues:**
- Placeholder variables (`!topic`, `!studNumber`, `!YearsRange`, `!citationCount`) were unspecified
- Basic citation format lacking volume/issue/pages
- Brief methodology list
- Vague findings description
- Typo: "greater that" → "greater than"
- Missing quality constraints section
- Missing future research directions in synthesis

**Refined Template (LaTeX-Ready):**
- Added volume/issue/pages to citations
- Expanded methodology examples (RCT, systematic review)
- Added effect sizes/statistical significance requirement
- Added demographic constraints and measurement instruments to limitations
- Specified citation sources (Google Scholar / Web of Science)
- Added PubMed ID for scientific topics
- Added **Future research directions** to Cross-Study Synthesis
- Added explicit **Quality constraints** section with peer-review requirement
- Added APA citation guidance
- Clarified `\verb|\section|` avoidance with bold headings

**Required User Inputs for Execution:**
1. Topic
2. Number of studies
3. Year range
4. Minimum citation count

---

## 2. Colored Framebox Prompt Design

**User Prompt:** Provide a colored framebox for this prompt.

**Three LaTeX Options Delivered:**

| Option | Style | Visual Characteristics | Best For |
|--------|-------|------------------------|----------|
| **Option 1** | Clean Academic Blue | Rounded rectangle, shadow, blue color scheme | General academic use |
| **Option 2** | Elegant Teal Sidebar | Left sidebar rule, minimalist, modern | Modern documents |
| **Option 3** | Modern Gradient Header | Gradient title bar, eye-catching | Presentations |

**Key LaTeX Packages:** `tcolorbox` (with `[most]` option), `xcolor`, `enumitem`

**Features Used:**
- `breakable`: Allows box to split across pages
- `colback` / `colframe`: Fill and border colors
- `arc`: Corner radius
- `leftrule`: Sidebar effect
- `attach boxed title`: Styled header bar
- `drop shadow`: Shadow effect

---

## 3. Bug Fix: PGFKeys Error in Drop Shadow

**User Error:**
```
Package pgfkeys Error: I do not know the key '/tikz/{promptblue!20!black}{-2pt}{4pt}{4pt}'
```

**Root Cause:** `drop shadow` in `tcolorbox` only accepts a **single color argument**. Passing multiple `{ }` groups (`{color}{x}{y}{offset}`) causes `pgfkeys` to misparse them as one long key path.

**Fix:**
```latex
% BROKEN:
drop shadow={promptblue!20!black}{-2pt}{4pt}{4pt}

% FIXED:
drop shadow=promptblue!40!black
```

**Alternative for Custom Offsets:**
```latex
shadow={2mm}{-2mm}{0mm}{promptblue!40!black}  % {xshift}{yshift}{offset}{color}
```

**Additional Fix:** Title text color corrected from `\textcolor{promptblue}{...}` to `\textcolor{white}{...}` since `colbacktitle=promptblue` makes the title bar blue.

---

## 4. Comprehensive Audit & Corrected Methodology

**User Prompt:** Proofread, audit the consistency and coherence of this report.

**User's Draft Content:**
- Definition of problem statement
- Step-by-step methodology with parameter list (`!ResearchTopic`, `!studNumber`, `!YearsRange`, `!numbGaps`, `!citationCount`, `!Context`, `!BibFormat`, `!ResearchSources`, Keywords, Inclusion/Exclusion criteria)
- `promptframebox` containing the literature review prompt
- Only 1 step in the methodology

**Audit Findings:**

| Category | Issue | Severity |
|----------|-------|----------|
| **Typo** | `!Context = Contex` misspelled; never referenced | High |
| **Unused Variables** | `!numbGaps = 4` and `!Context` defined but never used | High |
| **Placeholder Inconsistency** | Mix of `!Var`, `[INSERT !Var]`, and empty bullets | High |
| **LaTeX Nesting** | `promptframebox` inside `itemize` inside `enumerate` needs care | Medium |
| **Structural** | Only 1 step in "Step-by-step methodology" — incomplete | Medium |
| **Punctuation** | `!ResearchSources` trailing comma and double space | Low |
| **Logic** | Claims to define "search strategy" but jumps to output prompt | Medium |

**Key Corrections Applied:**

1. **Removed unused variables:** `!numbGaps` and `!Context` deleted from parameter list; `!numbGaps` reintroduced in Step 2 where it belongs
2. **Unified placeholder syntax:** All fillable fields use `\texttt{[INSERT DESCRIPTION]}`; hardcoded values appear directly
3. **Fixed typo:** `Contex` removed entirely
4. **Completed methodology structure:** Expanded from 1 step to 4 coherent steps:
   - **Step 1:** Define search strategy + execute prompt
   - **Step 2:** Analyze synthesized literature, extract exactly 4 gaps
   - **Step 3:** Draft the problem statement (what is known, what is missing, stakeholders, consequences, how study addresses gap)
   - **Step 4:** Validate against definition (researchable, demonstrable, measurable, stakeholder-aware)
5. **LaTeX technical fixes:**
   - `\paragraph*{Definition.}` → `\paragraph*{Definition}` (removed double period)
   - `\LaTeX\` with proper spacing
   - `---` (em dash) instead of `--`
   - Year range `2023--2026` (en dash)
   - `\verb` works with `[most]` library

---

## 5. Agentic Automation Feasibility Analysis

**User Prompt:** From this report, one may create an agent to automate this procedure?

**Answer:** Yes — with **human-in-the-loop validation** for critical intellectual steps.

**Automation Feasibility by Step:**

| Step | Task | Automation Level | Human Required? |
|------|------|-----------------|-----------------|
| **1** | Parameter configuration | Manual input | **Yes** |
| **1** | Literature search execution | **Fully automated** | No |
| **1** | Citation & metadata extraction | **Fully automated** | No |
| **2** | Cross-study synthesis | **Semi-automated** | Review suggested |
| **2** | Gap extraction (×4) | **Semi-automated** | Review required |
| **3** | Problem statement drafting | **Semi-automated** | Strongly advised |
| **4** | Validation against definition | Automated check + human sign-off | Final approval essential |

**Proposed Agent Architecture (Conceptual):**
```
INPUT LAYER → SEARCH LAYER (Semantic Scholar, CrossRef, OpenAlex, PubMed) 
→ ANALYSIS LAYER (PDF extraction, methodology classifier, citation enrichment) 
→ SYNTHESIS LAYER (Theme clustering, contradiction detection, gap ranking) 
→ OUTPUT LAYER (LaTeX review, problem statement, validation checklist)
```

**Critical Risks Identified:**
1. **Hallucination in Synthesis:** LLMs invent plausible but false trends
   - *Mitigation:* RAG architecture with retrieved excerpts, confidence scores, human verification flags
2. **Citation Count Volatility:** `!citationCount = 1` includes unvalidated recent work
   - *Mitigation:* Tiered thresholds (≥50 established, ≥10 emerging, ≥1 cutting-edge)
3. **"Researchable / Measurable" Judgment:** Semantic judgment requiring domain ontologies
   - *Mitigation:* Field-specific fine-tuning, never fully automate Step 4
4. **Database Coverage Gaps:** No single API covers all disciplines
   - *Mitigation:* Domain routing (PubMed biomedical, IEEE engineering, arXiv CS/math)

---

## 6. Research Accelerant Agent Design

**User Prompt:** Using agentic capabilities, design a research accelerant to automate search, extraction, formatting, and preliminary synthesis. Prioritize: MVP → V2 → V3.

### Three Progressive Versions

| Version | Name | Pipeline | Description |
|---------|------|----------|-------------|
| **MVP** | Search & Format Agent | `Search → Extract → LaTeX Literature Review` | Parameterized search → formatted LaTeX output |
| **V2** | Synthesis Agent | `MVP + Cross-study synthesis + Gap suggestion + Thematic analysis` | Human reviews before finalizing |
| **V3** | Problem Statement Generator | `V2 + Problem statement drafting + Human approval gates` | Full pipeline through Step 4 |

### Full System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React 19 + TypeScript)              │
├─────────────────────────────────────────────────────────────────┤
│  Home Page (/)      │ Parameterized search form with version    │
│                     │ selector (MVP / V2 / V3)                  │
├─────────────────────────────────────────────────────────────────┤
│  Session Page       │ Pipeline progress tracker, paper cards,    │
│  (/session/:id)     │ synthesis view, gap selector, LaTeX preview │
├─────────────────────────────────────────────────────────────────┤
│  History Page       │ List all past sessions with status badges   │
│  (/history)         │ and quick actions                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              BACKEND (Hono + tRPC 11 + TypeScript)                │
├─────────────────────────────────────────────────────────────────┤
│  search router     │ createSession → execute → get/list/delete  │
│  synthesis router  │ run (cross-study synthesis) → get → update  │
│  statement router  │ draft → get → update → approve / reject    │
│  latex router      │ generateReview / Synthesis / Statement /   │
│                    │ FullPipeline → listBySession                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              SERVICES (Academic APIs + Processing)                  │
├─────────────────────────────────────────────────────────────────┤
│  academic-search   │ Semantic Scholar API + OpenAlex API         │
│                    │ Parallel queries, dedup, sort by citations  │
├─────────────────────────────────────────────────────────────────┤
│  synthesis-engine  │ Rule-based methodology classifier,        │
│                    │ theme extraction, heuristic gap detection   │
├─────────────────────────────────────────────────────────────────┤
│  latex-generator   │ APA / MLA / IEEE / BibTeX citation        │
│                    │ formatters, full document assembly          │
├─────────────────────────────────────────────────────────────────┤
│  memory-store      │ In-memory session persistence (ready for    │
│                    │ Drizzle ORM upgrade to MySQL)               │
└─────────────────────────────────────────────────────────────────┘
```

### Key Features Implemented

**Academic Search:**
- Parallel queries to **Semantic Scholar** and **OpenAlex** APIs
- Configurable: topic, keywords, year range, citation thresholds
- Auto-deduplication by DOI, sorted by citation count

**Cross-Study Synthesis (V2):**
- Automatic **methodology classification** (experimental, meta-analysis, qualitative, etc.)
- **Theme extraction** from titles and abstracts
- **Gap detection** with 4 prioritized gaps per review
- Human-editable synthesis fields

**Problem Statement Generator (V3):**
- Structured 5-component problem statement:
  1. What is known
  2. What is missing or problematic
  3. Who is affected (stakeholders)
  4. Consequences of inaction
  5. How the proposed study will address the gap
- **Human approval gates:** Validation checklist + approve/reject with feedback
- Status tracking: `draft → review_pending → approved/rejected`

**LaTeX Export:**
- Publication-ready output in **APA, MLA, Chicago, IEEE, or BibTeX**
- Professional formatting with `tcolorbox` environments
- Four document types: Literature Review, Synthesis, Problem Statement, Full Pipeline

### API Endpoints (tRPC)

| Router | Procedure | Description |
|--------|-----------|-------------|
| `search` | `createSession` | Initialize search with parameters |
| `search` | `execute` | Run academic API search |
| `search` | `getSession` | Retrieve session + papers |
| `synthesis` | `run` | Generate cross-study synthesis |
| `synthesis` | `get` / `update` | Retrieve or edit synthesis |
| `statement` | `draft` | Create problem statement from gap |
| `statement` | `approve` / `reject` | Human approval gates |
| `latex` | `generateReview` | LaTeX literature review |
| `latex` | `generateSynthesis` | LaTeX synthesis report |
| `latex` | `generateStatement` | LaTeX problem statement |
| `latex` | `generateFullPipeline` | Combined V1+V2+V3 document |

### Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS, shadcn/ui, tRPC React Query
- **Backend:** Hono, tRPC 11, TypeScript, superjson
- **Database:** Drizzle ORM schema ready (in-memory store for demo)
- **Academic APIs:** Semantic Scholar, OpenAlex

### Production Roadmap

1. **Switch to MySQL:** Replace in-memory store with Drizzle ORM queries
2. **Add LLM Integration:** Replace rule-based synthesis with GPT-4/Claude
3. **PDF Compilation:** Add `pdflatex` service to compile `.tex` → `.pdf`
4. **Add Auth:** Enable user accounts and saved sessions per researcher
5. **Citation Enrichment:** Integrate Web of Science and Scopus APIs

---

## Core Philosophy

> **The agent is a research accelerant, not a replacement for scholarly judgment.**
> Automate 60–70% of the workflow (search, extraction, formatting, preliminary synthesis), but preserve **human-in-the-loop validation** for the intellectual work: verifying that gaps are *demonstrable*, problems are *researchable*, and statements resonate with review criteria.
