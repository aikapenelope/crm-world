'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import { ArrowLeft, FileText } from 'lucide-react'

type Props = { params: { orgSlug: string } }


type Assembly = {
  id: string
  assembly_number: string
  assembly_type: string
  title: string
  date: string
  status: string
  location: string | null
  attendees_count: number | null
}

const TYPE_LABELS: Record<string, string> = {
  ordinary: 'Asamblea Ordinaria',
  extraordinary: 'Asamblea Extraordinaria',
  emergency: 'Sesión de Emergencia',
}

export default function PortalDocumentsPage({ params }: Props) {
  const router = useRouter()
  const [assemblies, setAssemblies] = React.useState<Assembly[]>([])
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
      const res = await apiCall<{ items: Assembly[] }>(
        `/api/condo-portal/documents?building_id=${bid}`,
        undefined,
        { fallback: { items: [] } },
      )
      setAssemblies(res.result?.items ?? [])
      setIsLoading(false)
    }
    load()
  }, [])

  const backUrl = unitId ? `/${params.orgSlug}/portal/dashboard?unit_id=${unitId}` : `/${params.orgSlug}/portal/dashboard`

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6 flex items-center gap-3">
        <Button type="button" variant="ghost" size="sm" onClick={() => router.push(backUrl)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Inicio
        </Button>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <FileText className="size-5" />
          Documentos
        </h1>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Actas de asambleas y documentos del edificio.
      </p>

      {isLoading && <div className="text-center py-8 text-muted-foreground">Cargando...</div>}

      {!isLoading && assemblies.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No hay documentos disponibles.
        </div>
      )}

      <div className="space-y-3">
        {assemblies.map(a => (
          <div key={a.id} className="rounded-lg border p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-muted-foreground">{a.assembly_number}</span>
                  <Badge variant="outline" className="text-xs">
                    {TYPE_LABELS[a.assembly_type] ?? a.assembly_type}
                  </Badge>
                </div>
                <p className="font-medium text-sm">{a.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(a.date).toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  {a.location && ` · ${a.location}`}
                  {a.attendees_count !== null && ` · ${a.attendees_count} asistentes`}
                </p>
              </div>
              <Badge variant={a.status === 'completed' ? 'secondary' : 'outline'} className="text-xs shrink-0">
                {a.status === 'completed' ? 'Completada' : 'En progreso'}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
