'use client'

import { useState } from 'react'
import type { Address, PropertyBrief } from '@/lib/types'

type PageState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; brief: PropertyBrief }
  | { status: 'error'; message: string }

const CONFIDENCE_BADGE: Record<'high' | 'medium' | 'low', string> = {
  high: 'bg-green-100 text-green-800',
  medium: 'bg-amber-100 text-amber-800',
  low: 'bg-red-100 text-red-800',
}

export default function HomePage() {
  const [form, setForm] = useState<Address>({
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
  })
  const [state, setState] = useState<PageState>({ status: 'idle' })
  const [evidenceOpen, setEvidenceOpen] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setState({ status: 'loading' })
    try {
      const res = await fetch('/api/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: form }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Unknown error')
      setState({ status: 'success', brief: data.brief })
      setEvidenceOpen(false)
    } catch (err) {
      setState({ status: 'error', message: (err as Error).message })
    }
  }

  const brief = state.status === 'success' ? state.brief : null

  return (
    <div className="min-h-screen bg-zinc-50 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Property Intelligence Brief</h1>
          <p className="mt-1 text-sm text-zinc-500">Enter a property address to generate a reliable buyer brief.</p>
        </div>

        {/* Address Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-zinc-600 mb-1">Street Address</label>
              <input
                name="street"
                value={form.street}
                onChange={handleChange}
                required
                placeholder="123 Main St"
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">City</label>
              <input
                name="city"
                value={form.city}
                onChange={handleChange}
                required
                placeholder="Austin"
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">State</label>
              <input
                name="state"
                value={form.state}
                onChange={handleChange}
                required
                maxLength={2}
                placeholder="TX"
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">Postal Code</label>
              <input
                name="postalCode"
                value={form.postalCode}
                onChange={handleChange}
                required
                placeholder="78701"
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">Country</label>
              <input
                name="country"
                value={form.country}
                onChange={handleChange}
                required
                placeholder="US"
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={state.status === 'loading'}
            className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 transition-colors"
          >
            {state.status === 'loading' ? 'Generating brief…' : 'Generate Brief'}
          </button>
        </form>

        {/* Error */}
        {state.status === 'error' && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {state.message}
          </div>
        )}

        {/* Loading skeleton */}
        {state.status === 'loading' && (
          <div className="space-y-3 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-zinc-200" />
            ))}
          </div>
        )}

        {/* Brief Display */}
        {brief && (
          <div className="space-y-4">

            {/* Overview */}
            <section className="bg-white rounded-xl border border-zinc-200 p-6">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-2">Overview</h2>
              <p className="text-sm text-zinc-700 leading-relaxed">{brief.overview}</p>
            </section>

            {/* Key Facts */}
            <section className="bg-white rounded-xl border border-zinc-200 p-6">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-3">Key Property Facts</h2>
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {brief.keyFacts.map(fact => (
                  <div key={fact.field} className="rounded-lg bg-zinc-50 px-3 py-2">
                    <dt className="text-xs text-zinc-500 capitalize">{fact.field}</dt>
                    <dd className="mt-0.5 text-sm font-medium text-zinc-900">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            {/* Neighborhood */}
            <section className="bg-white rounded-xl border border-zinc-200 p-6">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-2">Neighborhood Context</h2>
              <p className="text-sm text-zinc-700 leading-relaxed">{brief.neighborhoodContext}</p>
            </section>

            {/* Comps */}
            <section className="bg-white rounded-xl border border-zinc-200 p-6">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-2">Comparable Market Signals</h2>
              <p className="text-sm text-zinc-700 leading-relaxed">{brief.comparableSignals}</p>
            </section>

            {/* Risks */}
            <section className="bg-white rounded-xl border border-zinc-200 p-6">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-2">Risks / Unknowns</h2>
              <ul className="space-y-1.5">
                {brief.risksAndUnknowns.map((risk, i) => (
                  <li key={i} className="flex gap-2 text-sm text-amber-700">
                    <span className="mt-0.5 shrink-0">⚠</span>
                    {risk}
                  </li>
                ))}
              </ul>
            </section>

            {/* Confidence */}
            <section className="bg-white rounded-xl border border-zinc-200 p-6 flex items-start justify-between gap-4">
              <p className="text-sm text-zinc-500 italic leading-relaxed">{brief.confidenceNotes}</p>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${CONFIDENCE_BADGE[brief.confidenceLevel]}`}>
                {brief.confidenceLevel} confidence
              </span>
            </section>

            {/* Evidence Panel */}
            <div className="bg-white rounded-xl border border-zinc-200">
              <button
                onClick={() => setEvidenceOpen(o => !o)}
                className="w-full flex items-center justify-between px-6 py-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors rounded-xl"
              >
                Sources & Evidence
                <span className="text-zinc-400">{evidenceOpen ? '▲' : '▼'}</span>
              </button>
              {evidenceOpen && (
                <div className="border-t border-zinc-100 px-6 py-4 space-y-4">
                  {brief.conflicts.length > 0 && (
                    <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 space-y-1">
                      <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Conflicts Detected</p>
                      {brief.conflicts.map(c => (
                        <p key={c.field} className="text-xs text-amber-700">{c.description}</p>
                      ))}
                    </div>
                  )}
                  <ul className="space-y-2">
                    {brief.sources.map(src => (
                      <li key={src.id} className="text-sm">
                        <span className="font-medium text-zinc-700">{src.title}</span>
                        {src.url && (
                          <a href={src.url} target="_blank" rel="noopener noreferrer" className="ml-2 text-xs text-zinc-400 underline hover:text-zinc-600">
                            {src.url}
                          </a>
                        )}
                        <p className="mt-0.5 text-xs text-zinc-400 line-clamp-2">{src.content}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
