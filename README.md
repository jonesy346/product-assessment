# Property Intelligence Brief

Turns scattered, inconsistent property information into a clear, reliable buyer-facing brief — with citations and confidence notes.

## Getting Started

### Prerequisites

- Node.js 18+
- An OpenAI API key (required for brief generation)
- A Tavily API key (optional — enables live web search; falls back to mock sources without it)

### Setup

```bash
npm install
```

Create a `.env.local` file in the project root:

```
OPENAI_API_KEY=your_openai_key_here
TAVILY_API_KEY=your_tavily_key_here   # optional
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), enter a property address, and click **Generate Brief**.

---

## How It Works

```
User submits address
  → POST /api/brief
  → Retriever: Tavily search (or mock fallback)
  → Normalizer: raw evidence → structured PropertyFact[]
  → ConflictResolver: detect inconsistencies across sources
  → BriefGenerator: gpt-4o prompt with facts, conflicts, and sources
  → Response: buyer-facing brief with citations and confidence level
```

### Services

| Service | Responsibility |
|---|---|
| `retrieve` | Fetch property, neighborhood, and comps evidence via Tavily or mock sources |
| `normalize` | Extract typed facts (bedrooms, sqft, price, etc.) from raw source content using regex heuristics |
| `detectConflicts` | Flag fields where sources disagree — numeric values differing by >5%, or mismatched strings |
| `generateBriefFromLLM` | Send facts, conflicts, and source evidence to gpt-4o; parse structured `PropertyBrief` response |

### Brief Sections

1. **Overview** — one-paragraph property summary
2. **Key Property Facts** — bedrooms, bathrooms, sqft, year built, price
3. **Neighborhood Context** — walkability, schools, amenities
4. **Comparable Market Signals** — recent sales, price per sqft trends
5. **Risks / Unknowns** — missing data, red flags, caveats
6. **Confidence Notes** — where sources agreed vs. conflicted, with a high / medium / low rating

---

## Design Decisions & Tradeoffs

**No vector database.** Retrieval is live search (Tavily) or structured mock JSON. This keeps setup simple and avoids pre-population — the right call for a prototype, but a production system handling many properties would benefit from caching retrieved evidence.

**Single-pass pipeline, no agent loop.** The flow is linear: retrieve → normalize → conflict-check → generate. This makes the system auditable and predictable. A multi-step agent could adaptively re-query for missing facts, but adds complexity and latency that isn't justified here.

**Conflict detection as first-class.** Rather than silently picking one value when sources disagree, conflicts are surfaced explicitly to the LLM and reflected in the brief's confidence level. This directly addresses the "reliable" requirement — the system is honest about what it doesn't know.

**Regex normalization over a second LLM call.** Extracting facts with regex heuristics is fast and deterministic. The tradeoff is brittleness — sources with unusual phrasing may be missed. A lightweight LLM extraction step would be more robust but adds latency and cost.

**Ollama as a future OpenAI alternative.** The brief generator could be swapped to use a local Ollama endpoint (which exposes an OpenAI-compatible API) to remove the OpenAI key dependency entirely. Not implemented due to time constraints.

**Mock fallback for deterministic demos.** Without a Tavily key the system returns the same structured mock evidence every time, making it easy to demo and test without API dependencies.

**Citations in output.** Every fact in the brief traces back to a source ID. The LLM is explicitly instructed to cite sources, and the evidence panel in the UI lists all sources with detected conflicts highlighted.

---

### Project Structure

```
app/
  page.tsx                  # Address form + brief display (client component)
  api/brief/route.ts        # POST /api/brief — thin handler, delegates to service
lib/
  types.ts                  # Shared TypeScript interfaces
  mockSources.ts            # 10 structured mock evidence sources
  propertyBriefService.ts   # retrieve → normalize → detectConflicts → generateBrief
```
