'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@open-mercato/ui/primitives/button'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'

type Props = { params: { orgSlug: string } }


const CATEGORY_OPTIONS = [
  { value: 'plumbing', label: 'Plomería' },
  { value: 'electrical', label: 'Electricidad' },
  { value: 'elevator', label: 'Ascensor' },
  { value: 'structural', label: 'Estructura' },
  { value: 'cleaning', label: 'Limpieza' },
  { value: 'security', label: 'Seguridad' },
  { value: 'garden', label: 'Jardines' },
  { value: 'pool', label: 'Piscina' },
  { value: 'other', label: 'Otro' },
]

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Baja — sin urgencia' },
  { value: 'medium', label: 'Media — requiere atención pronta' },
  { value: 'high', label: 'Alta — problema significativo' },
  { value: 'emergency', label: 'Emergencia — riesgo inmediato' },
]

export default function PortalMaintenanceCreatePage({ params }: Props) {
  const router = useRouter()
  const [unitId, setUnitId] = React.useState<string | null>(null)
  const [buildingId, setBuildingId] = React.useState<string | null>(null)
  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [category, setCategory] = React.useState('other')
  const [priority, setPriority] = React.useState('medium')
  const [submitting, setSubmitting] = React.useState(false)
  const [submitted, setSubmitted] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const url = new URL(window.location.href)
    setUnitId(url.searchParams.get('unit_id'))
    setBuildingId(url.searchParams.get('building_id'))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!buildingId && !unitId) {
      setError('No se pudo identificar el edificio. Regresa al inicio.')
      return
    }
    setSubmitting(true)
    setError(null)

    const res = await apiCall<{ request_number?: string }>('/api/condo-portal/maintenance-request', {
      method: 'POST',
      body: JSON.stringify({
        building_id: buildingId ?? null,
        unit_id: unitId ?? null,
        title,
        description,
        category,
        priority,
      }),
    })

    if (res.ok && res.result?.request_number) {
      setSubmitted(res.result.request_number)
    } else {
      setError('Error al enviar la solicitud. Intenta nuevamente.')
    }
    setSubmitting(false)
  }

  const backUrl = unitId
    ? `/${params.orgSlug}/portal/maintenance?unit_id=${unitId}${buildingId ? `&building_id=${buildingId}` : ''}`
    : `/${params.orgSlug}/portal/maintenance`

  if (submitted) {
    return (
      <div className="mx-auto max-w-md p-6 text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle2 className="size-12 text-primary" />
        </div>
        <h2 className="text-xl font-bold mb-2">Solicitud enviada</h2>
        <p className="text-muted-foreground mb-1">Número de solicitud:</p>
        <p className="font-mono text-lg font-bold mb-6">{submitted}</p>
        <p className="text-sm text-muted-foreground mb-6">
          La administración recibirá tu solicitud y te contactará pronto.
        </p>
        <div className="flex gap-3 justify-center">
          <Button type="button" variant="outline" size="sm" onClick={() => router.push(backUrl)}>
            Ver mis solicitudes
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setSubmitted(null)
              setTitle('')
              setDescription('')
              setCategory('other')
              setPriority('medium')
            }}
          >
            Nueva solicitud
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl p-6">
      <div className="mb-6 flex items-center gap-3">
        <Button type="button" variant="ghost" size="sm" onClick={() => router.push(backUrl)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Mantenimiento
        </Button>
        <h1 className="text-xl font-bold">Nueva solicitud</h1>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium block mb-1">Título *</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            maxLength={255}
            placeholder="Ej: Fuga de agua en baño principal"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Descripción detallada *</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            required
            rows={4}
            placeholder="Describe el problema con el mayor detalle posible..."
            className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-1">Categoría</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              {CATEGORY_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Urgencia</label>
            <select
              value={priority}
              onChange={e => setPriority(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              {PRIORITY_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-2">
          <Button type="submit" disabled={submitting || !title || !description} className="w-full">
            {submitting ? 'Enviando...' : 'Enviar solicitud'}
          </Button>
        </div>
      </form>
    </div>
  )
}
