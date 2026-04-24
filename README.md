# Property Intelligence Brief

Turns scattered, inconsistent property information into a clear, reliable buyer-facing brief — with citations and confidence notes.

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
