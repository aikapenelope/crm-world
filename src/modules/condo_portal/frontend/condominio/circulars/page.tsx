'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import { ArrowLeft, Mail } from 'lucide-react'

type Circular = {
  id: string
  circular_number: string
  category: string
  title: string
  content: string
  status: string
  created_at: string
}

const CATEGORY_LABELS: Record<string, string> = {
  general: 'General', maintenance: 'Mantenimiento', assembly: 'Asamblea',
  finance: 'Finanzas', rule: 'Normativa', urgent: 'Urgente',
}

export default function PortalCircularsPage() {
  const router = useRouter()
  const [circulars, setCirculars] = React.useState<Circular[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [unitId, setUnitId] = React.useState<string | null>(null)
  const [buildingId, setBuildingId] = React.useState<string | null>(null)
  const [expanded, setExpanded] = React.useState<string | null>(null)

  React.useEffect(() => {
    const url = new URL(window.location.href)
    const uid = url.searchParams.get('unit_id')
    const bid = url.searchParams.get('building_id')
    setUnitId(uid)
    setBuildingId(bid)
    if (!bid) { setIsLoading(false); return }

    async function load() {
      setIsLoading(true)
      const res = await apiCall<{ items: Circular[] }>(
        `/api/condo-portal/circulars?building_id=${bid}`,
        undefined,
        { fallback: { items: [] } },
      )
      setCirculars(res.result?.items ?? [])
      setIsLoading(false)
    }
    load()
  }, [])

  const backUrl = unitId ? `/condominio/dashboard?unit_id=${unitId}` : '/condominio/dashboard'

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6 flex items-center gap-3">
        <Button type="button" variant="ghost" size="sm" onClick={() => router.push(backUrl)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Inicio
        </Button>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Mail className="size-5" />
          Circulares
        </h1>
      </div>

      {isLoading && <div className="text-center py-8 text-muted-foreground">Cargando...</div>}

      {!isLoading && circulars.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No hay circulares publicadas.
        </div>
      )}

      <div className="space-y-3">
        {circulars.map(c => (
          <div key={c.id} className="rounded-lg border overflow-hidden">
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-start text-left h-auto p-4 rounded-none font-normal"
              onClick={() => setExpanded(expanded === c.id ? null : c.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-muted-foreground">{c.circular_number}</span>
                    <Badge variant="outline" className="text-xs">
                      {CATEGORY_LABELS[c.category] ?? c.category}
                    </Badge>
                  </div>
                  <p className="font-medium text-sm">{c.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(c.created_at).toLocaleDateString('es-VE', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <span className="text-muted-foreground text-sm shrink-0">{expanded === c.id ? '▲' : '▼'}</span>
              </div>
            </Button>
            {expanded === c.id && (
              <div className="px-4 pb-4 border-t bg-muted/10">
                <p className="text-sm whitespace-pre-wrap mt-3">{c.content}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
