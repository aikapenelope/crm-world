'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'

type Props = { params: { orgSlug: string; id: string } }


type VoteDetail = {
  id: string
  title: string
  description: string
  status: string
  vote_type: string
  quorum_percent: string
  total_aliquot_voted: string
  total_votes: number
  start_date: string | null
  end_date: string | null
  already_voted: boolean
}

const CHOICE_OPTIONS = [
  { value: 'yes', label: 'A favor', description: 'Voto afirmativo' },
  { value: 'no', label: 'En contra', description: 'Voto negativo' },
  { value: 'abstain', label: 'Abstención', description: 'Me abstengo de votar' },
]

export default function PortalVoteDetailPage(_props: Props) {
  const params = useParams()
  const router = useRouter()
  const voteId = params?.id as string

  const [vote, setVote] = React.useState<VoteDetail | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [selectedChoice, setSelectedChoice] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)
  const [voted, setVoted] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [unitId, setUnitId] = React.useState<string | null>(null)
  const [buildingId, setBuildingId] = React.useState<string | null>(null)

  React.useEffect(() => {
    const url = new URL(window.location.href)
    const uid = url.searchParams.get('unit_id')
    const bid = url.searchParams.get('building_id')
    setUnitId(uid)
    setBuildingId(bid)
    if (!bid || !voteId) { setIsLoading(false); return }

    async function load() {
      setIsLoading(true)
      const params = `building_id=${bid}${uid ? `&unit_id=${uid}` : ''}`
      const res = await apiCall<{ items: VoteDetail[] }>(
        `/api/condo-portal/votes?${params}`,
        undefined,
        { fallback: { items: [] } },
      )
      const found = res.result?.items?.find(v => v.id === voteId) ?? null
      setVote(found)
      if (found?.already_voted) setVoted(true)
      setIsLoading(false)
    }
    load()
  }, [voteId])

  async function handleVote() {
    if (!selectedChoice || !unitId || !voteId) return
    setSubmitting(true)
    setError(null)
    const res = await apiCall<{ error?: string }>('/api/condo-portal/votes/cast', {
      method: 'POST',
      body: JSON.stringify({ vote_id: voteId, unit_id: unitId, choice: selectedChoice }),
    })
    if (res.ok) {
      setVoted(true)
    } else {
      setError(res.result?.error ?? 'Error al registrar el voto.')
    }
    setSubmitting(false)
  }

  const backUrl = (() => {
    const p = new URLSearchParams()
    if (unitId) p.set('unit_id', unitId)
    if (buildingId) p.set('building_id', buildingId)
    return `/${(params as any).orgSlug}/portal/votes?${p.toString()}`
  })()

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Cargando...</div>
  if (!vote) return (
    <div className="mx-auto max-w-md p-6">
      <Button type="button" variant="ghost" size="sm" onClick={() => router.push(backUrl)}>
        <ArrowLeft className="mr-2 h-4 w-4" />Volver
      </Button>
      <p className="mt-4 text-muted-foreground">Votación no encontrada.</p>
    </div>
  )

  const progress = Number(vote.total_aliquot_voted)
  const quorum = Number(vote.quorum_percent)

  if (voted) {
    return (
      <div className="mx-auto max-w-md p-6 text-center">
        <CheckCircle2 className="size-12 text-primary mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Voto registrado</h2>
        <p className="text-muted-foreground mb-2">Tu voto ha sido registrado para:</p>
        <p className="font-medium mb-6">{vote.title}</p>
        <div className="mb-6 rounded-lg border p-4 text-left">
          <div className="text-sm text-muted-foreground mb-2">Participación actual</div>
          <div className="h-2 rounded-full bg-border overflow-hidden mb-1">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.min(100, (progress / quorum) * 100)}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground">
            {progress.toFixed(2)}% de {quorum.toFixed(0)}% quórum · {vote.total_votes} votos
          </div>
        </div>
        <Button type="button" variant="outline" onClick={() => router.push(backUrl)}>
          <ArrowLeft className="mr-2 size-4" />
          Volver a votaciones
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <Button type="button" variant="ghost" size="sm" onClick={() => router.push(backUrl)}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Votaciones
      </Button>

      <div className="mt-4 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant={vote.status === 'open' ? 'default' : 'secondary'}>
            {vote.status === 'open' ? 'Abierta' : 'Cerrada'}
          </Badge>
        </div>
        <h1 className="text-xl font-bold mb-2">{vote.title}</h1>
        {vote.description && (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{vote.description}</p>
        )}
      </div>

      {vote.status !== 'open' ? (
        <div className="rounded-lg border p-4 text-center text-muted-foreground text-sm">
          Esta votación ya no está activa.
        </div>
      ) : !unitId ? (
        <div className="rounded-lg border p-4 text-center text-muted-foreground text-sm">
          No se pudo identificar tu unidad. Regresa al inicio.
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-6">
            {CHOICE_OPTIONS.map(opt => (
              <Button
                key={opt.value}
                type="button"
                variant="ghost"
                onClick={() => setSelectedChoice(opt.value)}
                className={`w-full h-auto justify-start p-4 border rounded-lg font-normal transition-colors
                  ${selectedChoice === opt.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`size-4 rounded-full border-2 flex items-center justify-center
                    ${selectedChoice === opt.value ? 'border-primary' : 'border-border'}`}>
                    {selectedChoice === opt.value && (
                      <div className="size-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{opt.label}</div>
                    <div className="text-xs text-muted-foreground">{opt.description}</div>
                  </div>
                </div>
              </Button>
            ))}
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button
            type="button"
            className="w-full"
            disabled={!selectedChoice || submitting}
            onClick={handleVote}
          >
            {submitting ? 'Registrando voto...' : 'Confirmar voto'}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Tu voto es ponderado por el porcentaje de alícuota de tu unidad (Art. 23 LPH).
          </p>
        </>
      )}
    </div>
  )
}
