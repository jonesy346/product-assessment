export interface Address {
  street: string
  city: string
  state: string
  postalCode: string
  country: string
}

export interface EvidenceSource {
  id: string
  title: string
  url?: string
  content: string
  sourceType: 'property' | 'neighborhood' | 'comps'
}

export interface PropertyFact {
  field: string
  value: string | number
  sourceId: string
  confidence: 'high' | 'medium' | 'low'
}

export interface Conflict {
  field: string
  values: { value: string | number; sourceId: string }[]
  description: string
}

export interface PropertyBrief {
  overview: string
  keyFacts: PropertyFact[]
  neighborhoodContext: string
  comparableSignals: string
  risksAndUnknowns: string[]
  confidenceNotes: string
  confidenceLevel: 'high' | 'medium' | 'low'
  conflicts: Conflict[]
  sources: EvidenceSource[]
}
