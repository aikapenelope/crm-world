'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@open-mercato/ui/primitives/button'
import { Input } from '@open-mercato/ui/primitives/input'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { ArrowLeft, Save } from 'lucide-react'

type BuildingOption = {
  id: string
  name: string
}

export default function CreateUnitPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [buildings, setBuildings] = React.useState<BuildingOption[]>([])
  const [form, setForm] = React.useState({
    building_id: '',
    unit_number: '',
    unit_type: 'apartment',
    floor: '',
    area_m2: '',
    aliquot_percent: '0.00000',
    bedrooms: '',
    bathrooms: '',
    parking_spots: 0,
    storage_units: 0,
    status: 'vacant',
    owner_name: '',
    owner_phone: '',
    owner_email: '',
    resident_name: '',
    resident_phone: '',
    notes: '',
  })

  React.useEffect(() => {
    async function loadBuildings() {
      const res = await apiCall<{ items: BuildingOption[] }>(
        '/api/condo-properties/buildings?pageSize=100',
        undefined,
        { fallback: { items: [] } },
      )
      if (res.ok) {
        setBuildings(res.result?.items ?? [])
      }
    }
    loadBuildings()
  }, [])

  function updateField(field: string, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setIsSubmitting(true)

    const payload = {
      ...form,
      floor: form.floor || null,
      area_m2: form.area_m2 || null,
      bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
      bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
      owner_name: form.owner_name || null,
      owner_phone: form.owner_phone || null,
      owner_email: form.owner_email || null,
      resident_name: form.resident_name || null,
      resident_phone: form.resident_phone || null,
      notes: form.notes || null,
    }

    const result = await apiCall('/api/condo-properties/units', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    if (result.ok) {
      flash({ type: 'success', message: 'Unidad creada exitosamente' })
      router.push('/backend/condo_properties/units')
    } else {
      flash({ type: 'error', message: 'Error al crear la unidad' })
    }
    setIsSubmitting(false)
  }

  return (
    <Page>
      <PageBody>
        <div className="mb-4 flex items-center gap-3">
          <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/condo_properties/units')}>
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-2xl font-bold">Nueva Unidad</h1>
        </div>

        <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Edificio *</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={form.building_id}
                onChange={(e) => updateField('building_id', e.target.value)}
                required
              >
                <option value="">Seleccionar...</option>
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Número de Unidad *</label>
              <Input
                value={form.unit_number}
                onChange={(e) => updateField('unit_number', e.target.value)}
                placeholder="4-A, PB-L3, PH-1"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Tipo *</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={form.unit_type}
                onChange={(e) => updateField('unit_type', e.target.value)}
              >
                <option value="apartment">Apartamento</option>
                <option value="penthouse">Penthouse</option>
                <option value="local">Local</option>
                <option value="office">Oficina</option>
                <option value="parking">Estacionamiento</option>
                <option value="storage">Depósito</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Piso</label>
              <Input
                value={form.floor}
                onChange={(e) => updateField('floor', e.target.value)}
                placeholder="4, PB, PH"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Área (m²)</label>
              <Input
                value={form.area_m2}
                onChange={(e) => updateField('area_m2', e.target.value)}
                placeholder="85.50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Alícuota % *</label>
              <Input
                value={form.aliquot_percent}
                onChange={(e) => updateField('aliquot_percent', e.target.value)}
                placeholder="2.34567"
              />
              <p className="mt-1 text-xs text-muted-foreground">Suma de todas debe ser 100%</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Habitaciones</label>
              <Input
                type="number"
                value={form.bedrooms}
                onChange={(e) => updateField('bedrooms', e.target.value)}
                min={0}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Baños</label>
              <Input
                type="number"
                value={form.bathrooms}
                onChange={(e) => updateField('bathrooms', e.target.value)}
                min={0}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Estado *</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={form.status}
                onChange={(e) => updateField('status', e.target.value)}
              >
                <option value="occupied">Ocupado</option>
                <option value="vacant">Vacante</option>
                <option value="for_sale">En Venta</option>
                <option value="for_rent">En Alquiler</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Puestos Estacionamiento</label>
              <Input
                type="number"
                value={form.parking_spots}
                onChange={(e) => updateField('parking_spots', Number(e.target.value))}
                min={0}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Maleteros</label>
              <Input
                type="number"
                value={form.storage_units}
                onChange={(e) => updateField('storage_units', Number(e.target.value))}
                min={0}
              />
            </div>
          </div>

          <fieldset className="rounded-lg border p-4">
            <legend className="px-2 text-sm font-medium">Propietario</legend>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Nombre</label>
                <Input
                  value={form.owner_name}
                  onChange={(e) => updateField('owner_name', e.target.value)}
                  placeholder="Juan Pérez"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Teléfono</label>
                <Input
                  value={form.owner_phone}
                  onChange={(e) => updateField('owner_phone', e.target.value)}
                  placeholder="+58 412 1234567"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Email</label>
                <Input
                  value={form.owner_email}
                  onChange={(e) => updateField('owner_email', e.target.value)}
                  placeholder="juan@email.com"
                />
              </div>
            </div>
          </fieldset>

          <fieldset className="rounded-lg border p-4">
            <legend className="px-2 text-sm font-medium">Residente (si es diferente al propietario)</legend>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Nombre</label>
                <Input
                  value={form.resident_name}
                  onChange={(e) => updateField('resident_name', e.target.value)}
                  placeholder="María López"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Teléfono</label>
                <Input
                  value={form.resident_phone}
                  onChange={(e) => updateField('resident_phone', e.target.value)}
                  placeholder="+58 414 7654321"
                />
              </div>
            </div>
          </fieldset>

          <div>
            <label className="mb-1 block text-sm font-medium">Notas</label>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              value={form.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="Observaciones adicionales..."
            />
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => router.push('/backend/condo_properties/units')}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <Save className="mr-2 size-4" />
              {isSubmitting ? 'Guardando...' : 'Crear Unidad'}
            </Button>
          </div>
        </form>
      </PageBody>
    </Page>
  )
}
