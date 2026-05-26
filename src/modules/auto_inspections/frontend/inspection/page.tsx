'use client'

import * as React from 'react'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { CheckCircle2, AlertTriangle, XCircle, Camera } from 'lucide-react'
import { useT } from '@open-mercato/shared/lib/i18n/context'

/**
 * Public Inspection Page — /inspection/[id]
 *
 * Shareable link (no auth required) where the customer can see:
 * - Overall vehicle condition
 * - Findings by system (brakes, engine, etc.) with condition badges
 * - Photos of each finding
 * - Recommended actions with urgency
 *
 * This is what gets sent via WhatsApp to the customer.
 */

type InspectionData = {
  id: string
  type: string
  overall_condition: string | null
  notes: string | null
  created_at: string
}

type InspectionItem = {
  id: string
  system_category: string
  item_name: string
  condition: string
  notes: string | null
  recommended_action: string | null
  urgency: string
}

type InspectionPhoto = {
  id: string
  photo_url: string
  photo_type: string
  caption: string | null
  inspection_item_id: string | null
}

const CONDITION_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  good: { icon: <CheckCircle2 className="size-4" />, label: 'Bueno', color: 'text-primary bg-primary/10' },
  fair: { icon: <AlertTriangle className="size-4" />, label: 'Regular', color: 'text-foreground bg-muted' },
  needs_attention: { icon: <AlertTriangle className="size-4" />, label: 'Requiere Atención', color: 'text-foreground bg-secondary' },
  critical: { icon: <XCircle className="size-4" />, label: 'Crítico', color: 'text-destructive bg-destructive/10' },
  not_inspected: { icon: null, label: 'No inspeccionado', color: 'text-muted-foreground bg-muted/50' },
}

const SYSTEM_LABELS: Record<string, string> = {
  brakes: 'Frenos', engine: 'Motor', suspension: 'Suspensión', electrical: 'Eléctrico',
  tires: 'Neumáticos', fluids: 'Fluidos', body: 'Carrocería', interior: 'Interior',
  exhaust: 'Escape', transmission: 'Transmisión', cooling: 'Enfriamiento', steering: 'Dirección', other: 'Otro',
}

const URGENCY_LABELS: Record<string, string> = {
  none: '', soon: 'Pronto', immediate: 'Inmediato',
}

export default function PublicInspectionPage() {
  const t = useT()
  const [inspection, setInspection] = React.useState<InspectionData | null>(null)
  const [items, setItems] = React.useState<InspectionItem[]>([])
  const [photos, setPhotos] = React.useState<InspectionPhoto[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [selectedPhoto, setSelectedPhoto] = React.useState<string | null>(null)

  const inspectionId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('id') : null

  React.useEffect(() => {
    if (!inspectionId) return
    async function load() {
      setIsLoading(true)
      const [iCall, itemsCall, photosCall] = await Promise.all([
        apiCall<{ items: InspectionData[] }>(`/api/auto-inspections/inspections?pageSize=1`, undefined, { fallback: { items: [] } }),
        apiCall<{ items: InspectionItem[] }>(`/api/auto-inspections/items?inspection_id=${inspectionId}&pageSize=100`, undefined, { fallback: { items: [] } }),
        apiCall<{ items: InspectionPhoto[] }>(`/api/auto-inspections/photos?inspection_id=${inspectionId}&pageSize=50`, undefined, { fallback: { items: [] } }),
      ])
      if (iCall.ok) setInspection(iCall.result?.items?.[0] ?? null)
      if (itemsCall.ok) setItems(itemsCall.result?.items ?? [])
      if (photosCall.ok) setPhotos(photosCall.result?.items ?? [])
      setIsLoading(false)
    }
    load()
  }, [inspectionId])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">{t('auto_inspections.public.loading', 'Cargando inspección...')}</p>
      </div>
    )
  }

  if (!inspection) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">{t('auto_inspections.public.not_found', 'Inspección no encontrada.')}</p>
      </div>
    )
  }

  // Group items by system
  const itemsBySystem = items.reduce((acc, item) => {
    const key = item.system_category
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {} as Record<string, InspectionItem[]>)

  const getPhotosForItem = (itemId: string) => photos.filter((p) => p.inspection_item_id === itemId)
  const generalPhotos = photos.filter((p) => !p.inspection_item_id)
  const overallConfig = inspection.overall_condition ? CONDITION_CONFIG[inspection.overall_condition] : null

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card px-4 py-6 text-center">
        <h1 className="text-xl font-bold">{t('auto_inspections.public.title', 'Inspección del Vehículo')}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {new Date(inspection.created_at).toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
        {overallConfig && (
          <div className={`inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-full ${overallConfig.color}`}>
            {overallConfig.icon}
            <span className="font-medium">{overallConfig.label}</span>
          </div>
        )}
      </div>

      {/* General Photos */}
      {generalPhotos.length > 0 && (
        <div className="px-4 py-4">
          <div className="grid grid-cols-2 gap-2">
            {generalPhotos.map((photo) => (
              <img
                key={photo.id}
                src={photo.photo_url}
                alt={photo.caption ?? 'Foto del vehículo'}
                className="w-full aspect-video object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setSelectedPhoto(photo.photo_url)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Findings by System */}
      <div className="px-4 py-4 space-y-4">
        {Object.entries(itemsBySystem).map(([system, systemItems]) => (
          <div key={system} className="rounded-lg border overflow-hidden">
            <div className="bg-muted/30 px-4 py-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold">{SYSTEM_LABELS[system] ?? system}</h3>
              <Badge variant="outline">{systemItems.length} items</Badge>
            </div>
            <div className="divide-y">
              {systemItems.map((item) => {
                const config = CONDITION_CONFIG[item.condition] ?? CONDITION_CONFIG.not_inspected
                const itemPhotos = getPhotosForItem(item.id)
                return (
                  <div key={item.id} className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.item_name}</span>
                      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${config.color}`}>
                        {config.icon}
                        <span>{config.label}</span>
                      </div>
                    </div>
                    {item.notes && <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>}
                    {item.recommended_action && (
                      <p className="text-xs mt-1">
                        <span className="font-medium">{t('auto_inspections.public.recommendation', 'Recomendación:')}</span>{' '}
                        {item.recommended_action}
                        {item.urgency !== 'none' && (
                          <Badge variant={item.urgency === 'immediate' ? 'destructive' : 'secondary'} className="ml-2 text-xs">
                            {URGENCY_LABELS[item.urgency]}
                          </Badge>
                        )}
                      </p>
                    )}
                    {itemPhotos.length > 0 && (
                      <div className="flex gap-2 mt-2 overflow-x-auto">
                        {itemPhotos.map((photo) => (
                          <img
                            key={photo.id}
                            src={photo.photo_url}
                            alt={photo.caption ?? ''}
                            className="h-16 w-16 object-cover rounded cursor-pointer hover:ring-2 hover:ring-primary flex-shrink-0"
                            onClick={() => setSelectedPhoto(photo.photo_url)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Notes */}
      {inspection.notes && (
        <div className="px-4 py-4">
          <div className="rounded-lg border p-4 bg-muted/30">
            <h3 className="text-sm font-semibold mb-1">{t('auto_inspections.public.notes_title', 'Notas del Técnico')}</h3>
            <p className="text-sm text-muted-foreground">{inspection.notes}</p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-6 text-center border-t">
        <p className="text-xs text-muted-foreground">
          {t('auto_inspections.public.footer', 'Inspección realizada por el taller. Para aprobar el presupuesto, contacte al taller.')}
        </p>
      </div>

      {/* Lightbox */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setSelectedPhoto(null)}>
          <img src={selectedPhoto} alt="" className="max-w-full max-h-[90vh] object-contain rounded-lg" />
        </div>
      )}
    </div>
  )
}
