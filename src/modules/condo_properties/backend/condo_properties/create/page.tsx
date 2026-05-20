'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@open-mercato/ui/primitives/button'
import { Input } from '@open-mercato/ui/primitives/input'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { ArrowLeft, Save } from 'lucide-react'

export default function CreateBuildingPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [form, setForm] = React.useState({
    name: '',
    code: '',
    building_type: 'residential',
    address: '',
    city: '',
    state: '',
    total_units: 0,
    total_floors: '',
    year_built: '',
    rif: '',
    admin_company: '',
  })

  function updateField(field: string, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setIsSubmitting(true)

    const payload = {
      ...form,
      total_floors: form.total_floors ? Number(form.total_floors) : null,
      year_built: form.year_built ? Number(form.year_built) : null,
      address: form.address || null,
      city: form.city || null,
      state: form.state || null,
      rif: form.rif || null,
      admin_company: form.admin_company || null,
    }

    const result = await apiCall('/api/condo-properties/buildings', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    if (result.ok) {
      flash({ type: 'success', message: 'Edificio creado exitosamente' })
      router.push('/backend/condo_properties')
    } else {
      flash({ type: 'error', message: 'Error al crear el edificio' })
    }
    setIsSubmitting(false)
  }

  return (
    <Page>
      <PageBody>
        <div className="mb-4 flex items-center gap-3">
          <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/condo_properties')}>
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-2xl font-bold">Nuevo Edificio</h1>
        </div>

        <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Nombre *</label>
              <Input
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Residencias Los Pinos"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Código *</label>
              <Input
                value={form.code}
                onChange={(e) => updateField('code', e.target.value)}
                placeholder="PINOS"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Tipo *</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={form.building_type}
                onChange={(e) => updateField('building_type', e.target.value)}
              >
                <option value="residential">Residencial</option>
                <option value="commercial">Comercial</option>
                <option value="mixed">Mixto</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Total Unidades</label>
              <Input
                type="number"
                value={form.total_units}
                onChange={(e) => updateField('total_units', Number(e.target.value))}
                min={0}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Pisos</label>
              <Input
                type="number"
                value={form.total_floors}
                onChange={(e) => updateField('total_floors', e.target.value)}
                placeholder="12"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Dirección</label>
              <Input
                value={form.address}
                onChange={(e) => updateField('address', e.target.value)}
                placeholder="Av. Principal, Urb. Los Pinos"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Ciudad</label>
              <Input
                value={form.city}
                onChange={(e) => updateField('city', e.target.value)}
                placeholder="Caracas"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Estado</label>
              <Input
                value={form.state}
                onChange={(e) => updateField('state', e.target.value)}
                placeholder="Distrito Capital"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">RIF</label>
              <Input
                value={form.rif}
                onChange={(e) => updateField('rif', e.target.value)}
                placeholder="J-12345678-9"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Administradora</label>
              <Input
                value={form.admin_company}
                onChange={(e) => updateField('admin_company', e.target.value)}
                placeholder="Admin. Los Pinos C.A."
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Año Construcción</label>
              <Input
                type="number"
                value={form.year_built}
                onChange={(e) => updateField('year_built', e.target.value)}
                placeholder="2005"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => router.push('/backend/condo_properties')}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <Save className="mr-2 size-4" />
              {isSubmitting ? 'Guardando...' : 'Crear Edificio'}
            </Button>
          </div>
        </form>
      </PageBody>
    </Page>
  )
}
