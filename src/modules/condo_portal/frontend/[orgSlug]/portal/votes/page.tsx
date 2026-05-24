'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import { ArrowLeft, Vote } from 'lucide-react'

type Props = { params: { orgSlug: string } }


type VoteItem = {
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
  created_at: string
  already_voted: boolean
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador', open: 'Abierta', closed: 'Cerrada', cancelled: 'Cancelada',
}

const TYPE_LABELS: Record<string, string> = {
  ordinary: 'Ordinaria', extraordinary: 'Extraordinaria', budget: 'Presupuesto',
  maintenance: 'Mantenimiento', regulation: 'Normativa',
}

export default function PortalVotesPage({ params }: Props) {
  const router = useRouter()
  const [votes, setVotes] = React.useState<VoteItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [unitId, setUnitId] = React.useState<string | null>(null)
  const [buildingId, setBuildingId] = React.useState<string | null>(null)

  React.useEffect(() => {
    const url = new URL(window.location.href)
    const uid = url.searchParams.get('unit_id')
    const bid = url.searchParams.get('building_id')
    setUnitId(uid)
    setBuildingId(bid)
    if (!bid) { setIsLoading(false); return }

    async function load() {
      setIsLoading(true)
      const params = `building_id=${bid}${uid ? `&unit_id=${uid}` : ''}`
      const res = await apiCall<{ items: VoteItem[] }>(
        `/api/condo-portal/votes?${params}`,
        undefined,
        { fallback: { items: [] } },
      )
      setVotes(res.result?.items ?? [])
      setIsLoading(false)
    }
    load()
  }, [])

  const backUrl = unitId ? `/${(params as any).orgSlug}/portal/dashboard?unit_id=${unitId}` : `/${(params as any).orgSlug}/portal/dashboard`

  const openVotes = votes.filter(v => v.status === 'open')
  const closedVotes = votes.filter(v => v.status !== 'open')

  function voteDetailUrl(voteId: string) {
    const params = new URLSearchParams()
    if (unitId) params.set('unit_id', unitId)
    if (buildingId) params.set('building_id', buildingId)
    return `/${(params as any).orgSlug}/portal/votes/${voteId}?${params.toString()}`
  }

  function VoteCard({ v }: { v: VoteItem }) {
    const progress = Number(v.total_aliquot_voted)
    const quorum = Number(v.quorum_percent)
    const quorumReached = progress >= quorum
    return (
      <div className="rounded-lg border p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={v.status === 'open' ? 'default' : 'secondary'} className="text-xs">
                {STATUS_LABELS[v.status] ?? v.status}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {TYPE_LABELS[v.vote_type] ?? v.vote_type}
              </Badge>
              {v.already_voted && (
                <Badge variant="secondary" className="text-xs">Ya votaste</Badge>
              )}
            </div>
            <p className="font-medium text-sm">{v.title}</p>
          </div>
          {v.status === 'open' && !v.already_voted && (
            <Button type="button" size="sm" onClick={() => router.push(voteDetailUrl(v.id))}>
              Votar
            </Button>
          )}
          {v.status === 'open' && v.already_voted && (
            <Button type="button" variant="outline" size="sm" onClick={() => router.push(voteDetailUrl(v.id))}>
              Ver
            </Button>
          )}
        </div>
        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Participación: {progress.toFixed(2)}%</span>
            <span>Quórum: {quorum.toFixed(0)}% {quorumReached ? '✓' : ''}</span>
          </div>
          <div className="h-1.5 rounded-full bg-border overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${quorumReached ? 'bg-primary' : 'bg-muted-foreground/50'}`}
              style={{ width: `${Math.min(100, (progress / quorum) * 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{v.total_votes} voto(s)</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6 flex items-center gap-3">
        <Button type="button" variant="ghost" size="sm" onClick={() => router.push(backUrl)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Inicio
        </Button>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Vote className="size-5" />
          Votaciones
        </h1>
      </div>

      {isLoading && <div className="text-center py-8 text-muted-foreground">Cargando...</div>}

      {!isLoading && votes.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">No hay votaciones disponibles.</div>
      )}

      {openVotes.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">ACTIVAS</h2>
          <div className="space-y-3">
            {openVotes.map(v => <VoteCard key={v.id} v={v} />)}
          </div>
        </div>
      )}

      {closedVotes.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">CERRADAS</h2>
          <div className="space-y-3">
            {closedVotes.map(v => <VoteCard key={v.id} v={v} />)}
          </div>
        </div>
      )}
    </div>
  )
}
