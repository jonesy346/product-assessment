import type { Address, EvidenceSource, PropertyFact, Conflict } from './types'
import { getMockSources } from './mockSources'

export async function retrieve(address: Address): Promise<EvidenceSource[]> {
  const tavilyKey = process.env.TAVILY_API_KEY
  if (!tavilyKey) return getMockSources(address)

  const { street, city, state } = address
  const queries = [
    `"${street} ${city} ${state}" property listing bedrooms bathrooms sqft price`,
    `${city} ${state} neighborhood schools walkability amenities`,
    `${city} ${state} recent home sales comps price per sqft`,
  ]

  const labels: EvidenceSource['sourceType'][] = ['property', 'neighborhood', 'comps']

  const results = await Promise.allSettled(
    queries.map((q, i) =>
      fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: tavilyKey, query: q, max_results: 3 }),
      })
        .then(r => r.json())
        .then((data: { results?: { title: string; url: string; content: string }[] }) =>
          (data.results ?? []).map((r, j): EvidenceSource => ({
            id: `${labels[i]}-${j + 1}`,
            title: r.title,
            url: r.url,
            content: r.content,
            sourceType: labels[i],
          }))
        )
    )
  )

  const sources: EvidenceSource[] = []
  for (const r of results) {
    if (r.status === 'fulfilled') sources.push(...r.value)
  }

  if (sources.length === 0) {
    console.warn('Tavily returned no results — falling back to mock sources')
    return getMockSources(address)
  }

  return sources
}

// ─── Normalizer ──────────────────────────────────────────────────────────────

const PATTERNS: Record<string, RegExp> = {
  bedrooms: /(\d+)\s*bed(?:room)?s?/i,
  bathrooms: /(\d+(?:\.\d+)?)\s*bath(?:room)?s?/i,
  sqft: /(\d[\d,]+)\s*(?:sq(?:uare)?\s*f(?:ee)?t|sqft)/i,
  price: /\$\s*(\d[\d,]+)/,
  yearBuilt: /(?:built\s+in|year\s+built[:\s]+)(\d{4})/i,
  lotSize: /(\d[\d,]*(?:\.\d+)?)\s*acres?/i,
}

function parseValue(raw: string, field: string): string | number {
  const cleaned = raw.replace(/,/g, '')
  if (field === 'price' || field === 'sqft' || field === 'bedrooms') return parseInt(cleaned, 10)
  if (field === 'bathrooms' || field === 'lotSize') return parseFloat(cleaned)
  if (field === 'yearBuilt') return parseInt(cleaned, 10)
  return raw
}

export function normalize(sources: EvidenceSource[]): PropertyFact[] {
  const facts: PropertyFact[] = []
  for (const source of sources) {
    if (source.sourceType !== 'property') continue
    for (const [field, pattern] of Object.entries(PATTERNS)) {
      const match = source.content.match(pattern)
      if (!match) continue
      facts.push({
        field,
        value: parseValue(match[1], field),
        sourceId: source.id,
        confidence: 'high',
      })
    }
  }
  return facts
}

// ─── Conflict Resolver ───────────────────────────────────────────────────────

export function detectConflicts(facts: PropertyFact[]): Conflict[] {
  const byField = new Map<string, PropertyFact[]>()
  for (const fact of facts) {
    const group = byField.get(fact.field) ?? []
    group.push(fact)
    byField.set(fact.field, group)
  }

  const conflicts: Conflict[] = []
  for (const [field, group] of byField.entries()) {
    if (group.length < 2) continue

    const values = group.map(f => ({ value: f.value, sourceId: f.sourceId }))
    const nums = values.map(v => Number(v.value)).filter(n => !isNaN(n))
    const isNumeric = nums.length === values.length

    let conflicted = false
    let description = ''

    if (isNumeric) {
      const min = Math.min(...nums)
      const max = Math.max(...nums)
      if (min > 0 && (max - min) / min > 0.05) {
        conflicted = true
        description = `Sources disagree on ${field}: values range from ${min} to ${max} (${Math.round(((max - min) / min) * 100)}% spread).`
      }
    } else {
      const unique = [...new Set(values.map(v => String(v.value).toLowerCase().trim()))]
      if (unique.length > 1) {
        conflicted = true
        description = `Sources disagree on ${field}: "${unique.join('" vs "')}."`
      }
    }

    if (conflicted) {
      conflicts.push({ field, values, description })
    }
  }

  return conflicts
}
