import { NextRequest, NextResponse } from 'next/server'
import type { Address } from '@/lib/types'
import { generateBrief } from '@/lib/propertyBriefService'

export async function POST(req: NextRequest) {
  let address: Address
  try {
    const body = await req.json()
    address = body.address
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!address?.street || !address?.city || !address?.state || !address?.postalCode || !address?.country) {
    return NextResponse.json({ error: 'All address fields are required' }, { status: 400 })
  }

  if (address.state.length !== 2) {
    return NextResponse.json({ error: 'State must be a 2-character code' }, { status: 400 })
  }

  try {
    const brief = await generateBrief(address)
    return NextResponse.json({ brief })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to generate brief'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
