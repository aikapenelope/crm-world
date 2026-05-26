'use client'

import * as React from 'react'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { Camera, Car, History, Upload } from 'lucide-react'
import { useT } from '@open-mercato/shared/lib/i18n/context'

type Vehicle = {
  id: string
  plate: string
  brand: string
  model: string
  year: number
  color: string | null
  vin: string | null
  engine_type: string
  transmission: string
  current_km: number
}

type Photo = {
  id: string
  photo_url: string
  photo_type: string
  caption: string | null
  taken_at: string
}

const PHOTO_TYPE_LABELS: Record<string, string> = {
  front: 'Frontal', rear: 'Trasera', left: 'Izquierda', right: 'Derecha',
  interior: 'Interior', engine: 'Motor', damage: 'Daño', other: 'Otra',
}

export default function VehicleDetailPage() {
  const t = useT()
  const [vehicle, setVehicle] = React.useState<Vehicle | null>(null)
  const [photos, setPhotos] = React.useState<Photo[]>([])
  const [activeTab, setActiveTab] = React.useState<'info' | 'photos' | 'history'>('info')
  const [isUploading, setIsUploading] = React.useState(false)
  const [selectedPhoto, setSelectedPhoto] = React.useState<Photo | null>(null)

  const vehicleId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('id') : null

  React.useEffect(() => {
    if (!vehicleId) return
    async function load() {
      const vCall = await apiCall<{ items: Vehicle[] }>(`/api/auto-vehicles/vehicles?pageSize=1&search=${vehicleId}`, undefined, { fallback: { items: [] } })
      if (vCall.ok && vCall.result?.items?.[0]) setVehicle(vCall.result.items[0])

      const pCall = await apiCall<{ items: Photo[] }>(`/api/auto-vehicles/photos?vehicle_id=${vehicleId}&pageSize=50`, undefined, { fallback: { items: [] } })
      if (pCall.ok) setPhotos(pCall.result?.items ?? [])
    }
    load()
  }, [vehicleId])

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !vehicleId) return
    setIsUploading(true)
    const photoUrl = URL.createObjectURL(file)
    const payload = { vehicle_id: vehicleId, photo_url: photoUrl, photo_type: 'other', caption: file.name }
    const call = await apiCall('/api/auto-vehicles/photos', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    }, { fallback: null })
    if (call.ok) {
      flash(t('auto_vehicles.create.success', 'Foto subida exitosamente'), 'success')
      const pCall = await apiCall<{ items: Photo[] }>(`/api/auto-vehicles/photos?vehicle_id=${vehicleId}&pageSize=50`, undefined, { fallback: { items: [] } })
      if (pCall.ok) setPhotos(pCall.result?.items ?? [])
    }
    setIsUploading(false)
  }

  if (!vehicle) {
    return (
      <Page>
        <PageBody>
          <div className="text-center py-8 text-muted-foreground">
            {t('auto_vehicles.detail.loading', 'Cargando vehículo...')}
          </div>
        </PageBody>
      </Page>
    )
  }

  const tabs = [
    { id: 'info' as const, label: t('auto_vehicles.detail.tab.info', 'Información'), icon: Car },
    { id: 'photos' as const, label: `${t('auto_vehicles.detail.tab.photos', 'Fotos')} (${photos.length})`, icon: Camera },
    { id: 'history' as const, label: t('auto_vehicles.detail.tab.history', 'Historial'), icon: History },
  ]

  return (
    <Page>
      <PageBody>
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
              <Car className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{vehicle.brand} {vehicle.model} {vehicle.year}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="font-mono font-bold">{vehicle.plate}</Badge>
                {vehicle.color && <span className="text-sm text-muted-foreground">{vehicle.color}</span>}
                {vehicle.current_km > 0 && <span className="text-sm text-muted-foreground">{vehicle.current_km.toLocaleString('es-VE')} km</span>}
              </div>
            </div>
          </div>

          {/* Camera upload button */}
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoUpload}
              disabled={isUploading}
            />
            <Button type="button" asChild disabled={isUploading}>
              <span>
                <Camera className="mr-2 size-4" />
                {isUploading ? t('auto_vehicles.detail.uploading', 'Subiendo...') : t('auto_vehicles.detail.take_photo', 'Tomar Foto')}
              </span>
            </Button>
          </label>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 border-b">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg border p-4 space-y-3">
              <h3 className="text-sm font-semibold">{t('auto_vehicles.detail.section.vehicle', 'Datos del Vehículo')}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">{t('auto_vehicles.detail.field.plate', 'Placa')}</span><span className="font-mono font-bold">{vehicle.plate}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t('auto_vehicles.detail.field.brand', 'Marca')}</span><span>{vehicle.brand}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t('auto_vehicles.detail.field.model', 'Modelo')}</span><span>{vehicle.model}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t('auto_vehicles.detail.field.year', 'Año')}</span><span>{vehicle.year}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t('auto_vehicles.detail.field.color', 'Color')}</span><span>{vehicle.color ?? '—'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t('auto_vehicles.detail.field.vin', 'VIN')}</span><span className="font-mono text-xs">{vehicle.vin ?? '—'}</span></div>
              </div>
            </div>
            <div className="rounded-lg border p-4 space-y-3">
              <h3 className="text-sm font-semibold">{t('auto_vehicles.detail.section.specs', 'Especificaciones')}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">{t('auto_vehicles.detail.field.engine', 'Motor')}</span><span>{vehicle.engine_type === 'gasoline' ? 'Gasolina' : vehicle.engine_type}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t('auto_vehicles.detail.field.transmission', 'Transmisión')}</span><span>{vehicle.transmission === 'automatic' ? 'Automático' : 'Manual'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t('auto_vehicles.detail.field.km', 'Kilometraje')}</span><span className="font-bold">{vehicle.current_km.toLocaleString('es-VE')} km</span></div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'photos' && (
          <div>
            {photos.length === 0 ? (
              <div className="rounded-lg border border-dashed p-12 text-center">
                <Camera className="mx-auto size-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-2">{t('auto_vehicles.detail.no_photos', 'No hay fotos del vehículo')}</p>
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} />
                  <Button type="button" variant="outline" asChild>
                    <span><Upload className="mr-2 size-4" />{t('auto_vehicles.detail.upload_first', 'Subir primera foto')}</span>
                  </Button>
                </label>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="group relative aspect-square rounded-lg overflow-hidden border cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                      onClick={() => setSelectedPhoto(photo)}
                    >
                      <img src={photo.photo_url} alt={photo.caption ?? ''} className="w-full h-full object-cover" />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                        <span className="text-xs text-white">{PHOTO_TYPE_LABELS[photo.photo_type] ?? photo.photo_type}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedPhoto && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
                    onClick={() => setSelectedPhoto(null)}
                  >
                    <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                      <img src={selectedPhoto.photo_url} alt={selectedPhoto.caption ?? ''} className="max-w-full max-h-[85vh] object-contain rounded-lg" />
                      <div className="absolute top-4 right-4">
                        <Button type="button" variant="secondary" size="sm" onClick={() => setSelectedPhoto(null)}>
                          {t('auto_vehicles.detail.close', 'Cerrar')}
                        </Button>
                      </div>
                      {selectedPhoto.caption && (
                        <p className="text-center text-white mt-2 text-sm">{selectedPhoto.caption}</p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="rounded-lg border p-6 text-center">
            <History className="mx-auto size-8 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">{t('auto_vehicles.detail.history_empty', 'El historial de servicios se muestra aquí cuando el vehículo tiene órdenes completadas.')}</p>
          </div>
        )}
      </PageBody>
    </Page>
  )
}
