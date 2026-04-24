import OpenAI from 'openai'
import type { Address, EvidenceSource, PropertyFact, Conflict, PropertyBrief } from './types'
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

// ─── Brief Generator ─────────────────────────────────────────────────────────

async function generateBriefFromLLM(
  address: Address,
  facts: PropertyFact[],
  conflicts: Conflict[],
  sources: EvidenceSource[]
): Promise<PropertyBrief> {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not set')

  const client = new OpenAI()

  const systemPrompt = `You are a trusted real estate analyst. Given property evidence, facts, and detected conflicts, produce a structured buyer-facing property brief.

Return ONLY valid JSON matching this exact shape:
{
  "overview": "string — one paragraph summary",
  "keyFacts": [{ "field": "string", "value": "string or number", "sourceId": "string", "confidence": "high|medium|low" }],
  "neighborhoodContext": "string — paragraph or bullets",
  "comparableSignals": "string — paragraph",
  "risksAndUnknowns": ["string"],
  "confidenceNotes": "string — where sources agreed vs conflicted",
  "confidenceLevel": "high|medium|low",
  "conflicts": [{ "field": "string", "values": [{ "value": "string or number", "sourceId": "string" }], "description": "string" }],
  "sources": [{ "id": "string", "title": "string", "url": "string or null", "content": "string", "sourceType": "property|neighborhood|comps" }]
}

Rules:
- keyFacts must contain exactly one entry per unique field — use simple lowercase names (e.g. "bedrooms", "sqft", "price"). Never repeat a field.
- Cite sources by ID in your prose where relevant.
- Flag every detected conflict clearly in confidenceNotes and risksAndUnknowns.
- Set confidenceLevel to "high" if sources broadly agree, "medium" for minor gaps, "low" for significant conflicts.
- Be concise and buyer-friendly. Do not invent facts not present in the sources.`

  const userPrompt = `Property address: ${address.street}, ${address.city}, ${address.state} ${address.postalCode}

Extracted facts:
${JSON.stringify(facts, null, 2)}

Detected conflicts:
${JSON.stringify(conflicts, null, 2)}

Source evidence:
${sources.map(s => `[${s.id}] ${s.title}\n${s.content}`).join('\n\n')}`

  let raw: string | null = null
  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    })
    raw = response.choices[0].message.content
    return JSON.parse(raw!) as PropertyBrief
  } catch {
    if (raw !== null) {
      try {
        const retry = await client.chat.completions.create({
          model: 'gpt-4o',
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        })
        return JSON.parse(retry.choices[0].message.content!) as PropertyBrief
      } catch {
        // fall through to degraded brief
      }
    }
    return {
      overview: 'Brief generation encountered an error. Please try again.',
      keyFacts: facts,
      neighborhoodContext: '',
      comparableSignals: '',
      risksAndUnknowns: ['LLM generation failed — data shown may be incomplete.'],
      confidenceNotes: 'Unable to generate confidence assessment.',
      confidenceLevel: 'low',
      conflicts,
      sources,
    }
  }
}

export async function generateBrief(address: Address): Promise<PropertyBrief> {
  const sources = await retrieve(address)
  const facts = normalize(sources)
  const conflicts = detectConflicts(facts)
  return generateBriefFromLLM(address, facts, conflicts, sources)
}
