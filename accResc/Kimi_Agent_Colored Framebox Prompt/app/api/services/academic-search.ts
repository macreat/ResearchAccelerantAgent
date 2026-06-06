/**
 * Academic Search Service
 * Integrates with Semantic Scholar and OpenAlex APIs
 * to retrieve paper metadata, citations, and abstracts.
 */

// ============================================================================
// Types
// ============================================================================
export interface PaperMetadata {
  externalId: string;
  source: string;
  title: string;
  authors: string[];
  year: number;
  journal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  url: string;
  abstract?: string;
  citationCount: number;
  citationCountSource: string;
  pdfUrl?: string;
  relevanceScore: number;
}

export interface SearchParams {
  topic: string;
  keywords?: string;
  yearFrom: number;
  yearTo: number;
  citationMin: number;
  numStudies: number;
  databases: string[];
  inclusionCriteria?: string;
  exclusionCriteria?: string;
}

// ============================================================================
// Semantic Scholar API
// ============================================================================
const SS_BASE_URL = "https://api.semanticscholar.org/graph/v1";

async function searchSemanticScholar(params: SearchParams): Promise<PaperMetadata[]> {
  const query = params.keywords || params.topic;
  const fields = [
    "paperId",
    "title",
    "authors",
    "year",
    "journal",
    "volume",
    "pages",
    "doi",
    "abstract",
    "citationCount",
    "openAccessPdf",
    "url",
  ].join(",");

  const url = new URL(`${SS_BASE_URL}/paper/search`);
  url.searchParams.set("query", query);
  url.searchParams.set("fields", fields);
  url.searchParams.set("limit", String(Math.min(params.numStudies * 3, 100)));
  url.searchParams.set("publicationDateOrYear", `${params.yearFrom}:${params.yearTo}`);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        // No API key needed for basic usage
      },
    });

    if (!response.ok) {
      console.warn(`Semantic Scholar API error: ${response.status}`);
      return [];
    }

    const data = await response.json() as {
      data?: Array<{
        paperId: string;
        title: string;
        authors: Array<{ name: string }>;
        year: number;
        journal?: { name: string; volume?: string; pages?: string };
        volume?: string;
        pages?: string;
        doi?: string;
        abstract?: string;
        citationCount?: number;
        openAccessPdf?: { url: string };
        url?: string;
      }>;
    };

    if (!data.data) return [];

    return data.data
      .filter((p) => (p.citationCount || 0) >= params.citationMin)
      .map((p) => ({
        externalId: p.paperId,
        source: "semantic_scholar",
        title: p.title,
        authors: p.authors.map((a) => a.name),
        year: p.year,
        journal: p.journal?.name,
        volume: p.journal?.volume || p.volume,
        pages: p.journal?.pages || p.pages,
        doi: p.doi,
        url: p.url || `https://www.semanticscholar.org/paper/${p.paperId}`,
        abstract: p.abstract,
        citationCount: p.citationCount || 0,
        citationCountSource: "Semantic Scholar",
        pdfUrl: p.openAccessPdf?.url,
        relevanceScore: 0,
      }));
  } catch (error) {
    console.error("Semantic Scholar search failed:", error);
    return [];
  }
}

// ============================================================================
// OpenAlex API
// ============================================================================
const OA_BASE_URL = "https://api.openalex.org";

async function searchOpenAlex(params: SearchParams): Promise<PaperMetadata[]> {
  const query = params.keywords || params.topic;

  // Build filter string
  const filters: string[] = [
    `from_publication_date:${params.yearFrom}-01-01`,
    `to_publication_date:${params.yearTo}-12-31`,
  ];

  const url = new URL(`${OA_BASE_URL}/works`);
  url.searchParams.set("search", query);
  url.searchParams.set("filter", filters.join(","));
  url.searchParams.set("per-page", String(Math.min(params.numStudies * 3, 100)));
  url.searchParams.set("sort", "cited_by_count:desc");

  // Request specific fields
  url.searchParams.set(
    "select",
    "id,display_name,authorships,publication_year,host_venue,biblio,doi,abstract,cited_by_count,open_access,concepts"
  );

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "ResearchAccelerant/1.0 (mailto:research@example.com)",
      },
    });

    if (!response.ok) {
      console.warn(`OpenAlex API error: ${response.status}`);
      return [];
    }

    const data = await response.json() as {
      results?: Array<{
        id: string;
        display_name: string;
        authorships?: Array<{ author: { display_name: string } }>;
        publication_year: number;
        host_venue?: { display_name: string; url?: string };
        biblio?: { volume?: string; issue?: string; first_page?: string; last_page?: string };
        doi?: string;
        abstract?: string;
        cited_by_count?: number;
        open_access?: { is_oa: boolean; oa_url?: string };
      }>;
    };

    if (!data.results) return [];

    return data.results
      .filter((p) => (p.cited_by_count || 0) >= params.citationMin)
      .map((p) => ({
        externalId: p.id,
        source: "openalex",
        title: p.display_name,
        authors: (p.authorships || []).map((a) => a.author.display_name),
        year: p.publication_year,
        journal: p.host_venue?.display_name,
        volume: p.biblio?.volume,
        issue: p.biblio?.issue,
        pages: p.biblio?.first_page
          ? `${p.biblio.first_page}-${p.biblio.last_page || ""}`
          : undefined,
        doi: p.doi,
        url: p.host_venue?.url || p.doi || p.id,
        abstract: p.abstract,
        citationCount: p.cited_by_count || 0,
        citationCountSource: "OpenAlex",
        pdfUrl: p.open_access?.oa_url,
        relevanceScore: 0,
      }));
  } catch (error) {
    console.error("OpenAlex search failed:", error);
    return [];
  }
}

// ============================================================================
// Main Search Orchestrator
// ============================================================================
export async function searchPapers(params: SearchParams): Promise<PaperMetadata[]> {
  const databases = params.databases.length > 0 ? params.databases : ["semantic_scholar"];
  const allResults: PaperMetadata[] = [];

  // Search across all configured databases in parallel
  const searchPromises: Promise<PaperMetadata[]>[] = [];

  if (databases.includes("semantic_scholar")) {
    searchPromises.push(searchSemanticScholar(params));
  }
  if (databases.includes("openalex")) {
    searchPromises.push(searchOpenAlex(params));
  }

  const results = await Promise.all(searchPromises);
  for (const r of results) {
    allResults.push(...r);
  }

  // Deduplicate by DOI or title similarity
  const seen = new Set<string>();
  const deduplicated: PaperMetadata[] = [];

  for (const paper of allResults) {
    const key = paper.doi || paper.title.toLowerCase().trim();
    if (!seen.has(key)) {
      seen.add(key);
      deduplicated.push(paper);
    }
  }

  // Sort by citation count (descending) then year (descending)
  deduplicated.sort((a, b) => {
    if (b.citationCount !== a.citationCount) return b.citationCount - a.citationCount;
    return b.year - a.year;
  });

  // Return top N results
  return deduplicated.slice(0, params.numStudies);
}

// ============================================================================
// Paper Enrichment - Get full details for a paper
// ============================================================================
export async function enrichPaperDetails(paperId: string, source: string): Promise<Partial<PaperMetadata>> {
  if (source === "semantic_scholar") {
    try {
      const response = await fetch(
        `${SS_BASE_URL}/paper/${paperId}?fields=abstract,tldr,fieldsOfStudy`,
        { headers: { Accept: "application/json" } }
      );
      if (!response.ok) return {};
      const data = await response.json() as {
        abstract?: string;
        tldr?: { text?: string };
        fieldsOfStudy?: string[];
      };
      return {
        abstract: data.abstract || data.tldr?.text,
      };
    } catch {
      return {};
    }
  }
  return {};
}
