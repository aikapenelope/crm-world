/**
 * AGM Exception: raw <form> — inline quick-add panel in list page
 *
 * This list page includes a small inline creation form (showForm toggle) for
 * recording common area reservations. CrudForm is designed for full-page
 * create/edit flows; the toggle-in-place UX pattern this page uses does not
 * cleanly map to CrudForm without significant layout restructuring.
 *
 * Acceptable to keep raw <form>. All other AGM rules apply.
 */
'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@open-mercato/ui/primitives/button'
import { Input } from '@open-mercato/ui/primitives/input'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { ArrowLeft, Plus, X } from 'lucide-react'

type CommonArea = { id: string; name: string; is_reservable: boolean; reservation_fee: string | null; capacity: number | null }
type Reservation = {
  id: string
  area_id: string
  reserved_by_name: string
  unit_number: string
  reservation_date: string
  start_time: string
  end_time: string
  purpose: string | null
  fee_amount: string
  status: string
}
type BuildingOption = { id: string; name: string }

export default function ReservationsPage() {
  const router = useRouter()
  const [areas, setAreas] = React.useState<CommonArea[]>([])
  const [reservations, setReservations] = React.useState<Reservation[]>([])
  const [buildings, setBuildings] = React.useState<BuildingOption[]>([])
  const [selectedBuilding, setSelectedBuilding] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(true)
  const [showForm, setShowForm] = React.useState(false)
  const [form, setForm] = React.useState({
    area_id: '',
    unit_id: '',
    reservation_date: '',
    start_time: '',
    end_time: '',
    purpose: '',
  })

  React.useEffect(() => {
    async function load() {
      const [bRes, aRes] = await Promise.all([
        apiCall<{ items: BuildingOption[] }>('/api/condo-properties/buildings?pageSize=100', undefined, { fallback: { items: [] } }),
        apiCall<{ items: CommonArea[] }>('/api/condo-properties/common-areas?pageSize=100', undefined, { fallback: { items: [] } }),
      ])
      if (bRes.ok) setBuildings(bRes.result?.items ?? [])
      if (aRes.ok) setAreas((aRes.result?.items ?? []).filter((a) => a.is_reservable))
    }
    load()
  }, [])

  React.useEffect(() => {
    async function loadReservations() {
      setIsLoading(true)
      const res = await apiCall<{ items: Reservation[] }>(
        '/api/condo-properties/reservations',
        undefined,
        { fallback: { items: [] } },
      )
      if (res.ok) setReservations(res.result?.items ?? [])
      setIsLoading(false)
    }
    loadReservations()
  }, [])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const result = await apiCall('/api/condo-properties/reservations', {
      method: 'POST',
      body: JSON.stringify(form),
    })
    if (result.ok) {
      flash({ type: 'success', message: 'Reserva confirmada' })
      setShowForm(false)
      // Reload
      const res = await apiCall<{ items: Reservation[] }>('/api/condo-properties/reservations', undefined, { fallback: { items: [] } })
      if (res.ok) setReservations(res.result?.items ?? [])
    } else {
      flash({ type: 'error', message: (result as any).result?.error ?? 'Error al reservar' })
    }
  }

  async function handleCancel(id: string) {
    const result = await apiCall(`/api/condo-properties/reservations?id=${id}`, { method: 'DELETE' })
    if (result.ok) {
      flash({ type: 'success', message: 'Reserva cancelada' })
      setReservations((prev) => prev.map((r) => r.id === id ? { ...r, status: 'cancelled' } : r))
    }
  }

  const areaNames = new Map(areas.map((a) => [a.id, a.name]))

  return (
    <Page>
      <PageBody>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/condo_properties')}>
              <ArrowLeft className="size-4" />
            </Button>
            <h1 className="text-2xl font-bold">Reservas de Áreas Comunes</h1>
          </div>
          <Button type="button" onClick={() => setShowForm(true)}>
            <Plus className="mr-2 size-4" />
            Nueva Reserva
          </Button>
        </div>

        {/* New reservation form */}
        {showForm && (
          <div className="mb-6 rounded-lg border p-4">
            <h3 className="mb-3 font-medium">Nueva Reserva</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium">Área Común *</label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={form.area_id}
                  onChange={(e) => setForm((f) => ({ ...f, area_id: e.target.value }))}
                  required
                >
                  <option value="">Seleccionar...</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} {a.reservation_fee ? `($${a.reservation_fee})` : '(gratis)'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Fecha *</label>
                <Input
                  type="date"
                  value={form.reservation_date}
                  onChange={(e) => setForm((f) => ({ ...f, reservation_date: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Motivo</label>
                <Input
                  value={form.purpose}
                  onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))}
                  placeholder="Cumpleaños, reunión..."
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Hora Inicio *</label>
                <Input
                  type="time"
                  value={form.start_time}
                  onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Hora Fin *</label>
                <Input
                  type="time"
                  value={form.end_time}
                  onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))}
                  required
                />
              </div>
              <div className="flex items-end gap-2">
                <Button type="submit" size="sm">Reservar</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
              </div>
            </form>
          </div>
        )}

        {/* Reservations list */}
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : reservations.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay reservas registradas.</p>
        ) : (
          <div className="space-y-2">
            {reservations.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{areaNames.get(r.area_id) ?? 'Área'}</span>
                    <Badge variant={r.status === 'confirmed' ? 'default' : r.status === 'cancelled' ? 'secondary' : 'outline'}>
                      {r.status === 'confirmed' ? 'Confirmada' : r.status === 'cancelled' ? 'Cancelada' : 'Completada'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {r.reservation_date} — {r.start_time} a {r.end_time} — Unidad {r.unit_number} ({r.reserved_by_name})
                    {r.purpose && ` — ${r.purpose}`}
                  </p>
                </div>
                {r.status === 'confirmed' && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => handleCancel(r.id)}>
                    <X className="size-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </PageBody>
    </Page>
  )
}
