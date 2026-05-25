'use server'

import { apiCallOrThrow } from '@open-mercato/ui/backend/utils/apiCall'
import VerticalPresetsClient from './VerticalPresetsClient'
import type { VerticalDefinition } from '../../data/verticals'
import { VERTICALS } from '../../data/verticals'

type VerticalStateResponse = {
  ok: boolean
  vertical_key: string | null
  vertical: VerticalDefinition | null
  set_at: string | null
}

export default async function VerticalPresetsPage() {
  let currentVerticalKey: string | null = null

  try {
    const response = await apiCallOrThrow<VerticalStateResponse>(
      '/api/vertical-presets/tenant-vertical',
    )
    currentVerticalKey = response.result?.vertical_key ?? null
  } catch {
    // No vertical set yet — that's fine
  }

  return (
    <VerticalPresetsClient
      verticals={VERTICALS as unknown as VerticalDefinition[]}
      currentVerticalKey={currentVerticalKey}
    />
  )
}
