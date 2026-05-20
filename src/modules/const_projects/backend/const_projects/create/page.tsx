'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@open-mercato/ui/primitives/button'
import { Input } from '@open-mercato/ui/primitives/input'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { ArrowLeft, Save } from 'lucide-react'

export default function CreateProjectPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [form, setForm] = React.useState({
    name: '',
    code: '',
    project_type: 'residential',
    status: 'prospect',
    client_name: '',
    client_type: 'private',
    city: '',
    state: '',
    location: '',
    contract_number: '',
    contract_type: 'fixed_price',
    contract_amount: '',
    currency: 'USD',
    start_date: '',
    planned_end_date: '',
    advance_percent: '0',
    retention_percent: '10',
    project_manager: '',
    site_supervisor: '',
    description: '',
  })

  function set(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    const payload = {
      ...form,
      start_date: form.start_date || null,
      planned_end_date: form.planned_end_date || null,
      contract_number: form.contract_number || null,
      location: form.location || null,
      city: form.city || null,
      state: form.state || null,
      project_manager: form.project_manager || null,
      site_supervisor: form.site_supervisor || null,
      description: form.description || null,
    }
    const result = await apiCall('/api/const-projects/projects', { method: 'POST', body: JSON.stringify(payload) })
    if (result.ok) {
      flash({ type: 'success', message: 'Proyecto creado exitosamente' })
      router.push('/backend/const_projects')
    } else {
      flash({ type: 'error', message: 'Error al crear el proyecto' })
    }
    setIsSubmitting(false)
  }

  const sel = (field: string, opts: { value: string; label: string }[]) => (
    <select
      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
      value={(form as any)[field]}
      onChange={(e) => set(field, e.target.value)}
    >
      {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )

  return (
    <Page>
      <PageBody>
        <div className="mb-4 flex items-center gap-3">
          <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/const_projects')}>
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-2xl font-bold">Nuevo Proyecto</h1>
        </div>

        <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
          {/* Identificación */}
          <fieldset className="rounded-lg border p-4">
            <legend className="px-2 text-sm font-semibold">Identificación</legend>
            <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium">Nombre del Proyecto *</label>
                <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Torre Residencial Los Pinos" required />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Código *</label>
                <Input value={form.code} onChange={(e) => set('code', e.target.value)} placeholder="PINOS-2026" required />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Tipo *</label>
                {sel('project_type', [
                  { value: 'residential', label: 'Residencial' },
                  { value: 'commercial', label: 'Comercial' },
                  { value: 'infrastructure', label: 'Infraestructura' },
                  { value: 'industrial', label: 'Industrial' },
                  { value: 'renovation', label: 'Remodelación' },
                ])}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Estado</label>
                {sel('status', [
                  { value: 'prospect', label: 'Prospecto' },
                  { value: 'bidding', label: 'En Licitación' },
                  { value: 'awarded', label: 'Adjudicado' },
                  { value: 'in_progress', label: 'En Ejecución' },
                  { value: 'on_hold', label: 'Pausado' },
                  { value: 'completed', label: 'Completado' },
                  { value: 'cancelled', label: 'Cancelado' },
                ])}
              </div>
            </div>
          </fieldset>

          {/* Cliente */}
          <fieldset className="rounded-lg border p-4">
            <legend className="px-2 text-sm font-semibold">Cliente</legend>
            <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium">Nombre del Cliente *</label>
                <Input value={form.client_name} onChange={(e) => set('client_name', e.target.value)} placeholder="Inversiones Los Pinos, C.A." required />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Tipo de Cliente</label>
                {sel('client_type', [
                  { value: 'private', label: 'Privado' },
                  { value: 'public', label: 'Público / Ente del Estado' },
                ])}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Ciudad</label>
                <Input value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Caracas" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Estado/Región</label>
                <Input value={form.state} onChange={(e) => set('state', e.target.value)} placeholder="Miranda" />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-medium">Ubicación de la Obra</label>
                <Input value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="Av. Principal de Las Mercedes, frente al Centro Comercial..." />
              </div>
            </div>
          </fieldset>

          {/* Contrato */}
          <fieldset className="rounded-lg border p-4">
            <legend className="px-2 text-sm font-semibold">Contrato</legend>
            <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium">Nº Contrato</label>
                <Input value={form.contract_number} onChange={(e) => set('contract_number', e.target.value)} placeholder="CONT-2026-001" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Tipo de Contrato *</label>
                {sel('contract_type', [
                  { value: 'fixed_price', label: 'Suma Global (Precio Fijo)' },
                  { value: 'unit_price', label: 'Precios Unitarios' },
                  { value: 'cost_plus', label: 'Costo + Honorarios' },
                  { value: 'design_build', label: 'Diseño + Construcción' },
                ])}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Monto del Contrato *</label>
                <Input value={form.contract_amount} onChange={(e) => set('contract_amount', e.target.value)} placeholder="500000.00" required />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Moneda</label>
                {sel('currency', [
                  { value: 'USD', label: 'USD — Dólares' },
                  { value: 'VES', label: 'VES — Bolívares' },
                ])}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Anticipo (%)</label>
                <Input value={form.advance_percent} onChange={(e) => set('advance_percent', e.target.value)} placeholder="30" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Retención (%)</label>
                <Input value={form.retention_percent} onChange={(e) => set('retention_percent', e.target.value)} placeholder="10" />
                <p className="mt-1 text-xs text-muted-foreground">Garantía de fiel cumplimiento</p>
              </div>
            </div>
          </fieldset>

          {/* Fechas y Equipo */}
          <fieldset className="rounded-lg border p-4">
            <legend className="px-2 text-sm font-semibold">Fechas y Equipo</legend>
            <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium">Fecha de Inicio</label>
                <Input type="date" value={form.start_date} onChange={(e) => set('start_date', e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Fecha Fin Prevista</label>
                <Input type="date" value={form.planned_end_date} onChange={(e) => set('planned_end_date', e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Director de Obra</label>
                <Input value={form.project_manager} onChange={(e) => set('project_manager', e.target.value)} placeholder="Ing. Juan Pérez" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Residente de Obra</label>
                <Input value={form.site_supervisor} onChange={(e) => set('site_supervisor', e.target.value)} placeholder="Ing. María López" />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-medium">Descripción</label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="Descripción general del proyecto..."
                />
              </div>
            </div>
          </fieldset>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => router.push('/backend/const_projects')}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <Save className="mr-2 size-4" />
              {isSubmitting ? 'Guardando...' : 'Crear Proyecto'}
            </Button>
          </div>
        </form>
      </PageBody>
    </Page>
  )
}
