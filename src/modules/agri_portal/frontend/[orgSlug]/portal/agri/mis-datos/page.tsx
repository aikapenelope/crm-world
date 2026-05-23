'use client'

import * as React from 'react'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'

type Props = { params: { orgSlug: string } }

export default function MisDatosPage({ params }: Props) {
  void params
  const [data, setData] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    apiCall<any>('/api/agri-portal/producer-dashboard')
      .then(res => { if (res.ok && res.result) setData(res.result) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Cargando datos...</div>

  const farmUnit = (data as any)?.farm_unit
  const flock    = (data as any)?.flock

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mis Datos</h1>
        <p className="text-muted-foreground text-sm mt-1">Información de tu granja y contrato de integración</p>
      </div>

      {/* Farm unit info */}
      {farmUnit ? (
        <div className="border border-border rounded-xl p-4 bg-card">
          <h3 className="text-sm font-semibold mb-3">Mi Galpón</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Nombre</span>
              <span className="font-medium">{farmUnit.name}</span>
            </div>
            {farmUnit.unit_type && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Tipo</span>
                <span>{farmUnit.unit_type}</span>
              </div>
            )}
            {farmUnit.location_address && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Ubicación</span>
                <span className="text-right max-w-[200px]">{farmUnit.location_address}</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-4 bg-muted/20 rounded-xl text-sm text-muted-foreground">
          No se encontró información de galpón asociado a tu cuenta.
        </div>
      )}

      {/* Active cycle info */}
      {flock && (
        <div className="border border-border rounded-xl p-4 bg-card">
          <h3 className="text-sm font-semibold mb-3">Ciclo Activo</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Número de Lote</span>
              <span className="font-mono font-semibold">{flock.flock_number}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Especie</span>
              <span>{flock.species}{flock.genetic_line ? ` (${flock.genetic_line})` : ''}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Aves iniciales</span>
              <span className="font-semibold">{Number(flock.initial_count).toLocaleString('es-VE')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Fecha de entrada</span>
              <span>{new Date(flock.start_date).toLocaleDateString('es-VE')}</span>
            </div>
            {flock.planned_end_date && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Cosecha estimada</span>
                <span>{new Date(flock.planned_end_date).toLocaleDateString('es-VE')}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contact info placeholder */}
      <div className="border border-border rounded-xl p-4 bg-card">
        <h3 className="text-sm font-semibold mb-3">Contacto del Técnico de Campo</h3>
        <p className="text-sm text-muted-foreground">
          Para consultas sobre tu ciclo de producción o liquidaciones, contacta a tu técnico de campo asignado.
          Los datos de contacto están disponibles en tu contrato de integración.
        </p>
      </div>
    </div>
  )
}
