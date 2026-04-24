import type { Address, EvidenceSource } from './types'
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
