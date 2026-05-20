'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@open-mercato/ui/primitives/button'
import { Input } from '@open-mercato/ui/primitives/input'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { ArrowLeft, Save, Zap } from 'lucide-react'

type BuildingOption = { id: string; name: string }

export default function CreateFeeConfigPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [buildings, setBuildings] = React.useState<BuildingOption[]>([])
  const [createdId, setCreatedId] = React.useState<string | null>(null)
  const [form, setForm] = React.useState({
    building_id: '',
    name: '',
    fee_type: 'ordinary',
    period_month: '',
    base_amount: '',
    currency: 'USD',
    distribution_method: 'aliquot',
    due_date: '',
    late_fee_percent: '0',
    late_fee_days: 15,
    approved_in_assembly: false,
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

  function updateField(field: string, value: string | number | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setIsSubmitting(true)

    const payload = {
      ...form,
      notes: form.notes || null,
      status: 'draft',
    }

    const result = await apiCall<{ id: string }>('/api/condo-fees/configs', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    if (result.ok && result.result) {
      setCreatedId(result.result.id)
      flash({ type: 'success', message: 'Cuota creada exitosamente' })
    } else {
      flash({ type: 'error', message: 'Error al crear la cuota' })
    }
    setIsSubmitting(false)
  }

  async function handleGenerate() {
    if (!createdId) return
    setIsGenerating(true)

    const result = await apiCall<{ receipts_generated: number }>('/api/condo-fees/generate', {
      method: 'POST',
      body: JSON.stringify({ fee_config_id: createdId }),
    })

    if (result.ok && result.result) {
      flash({ type: 'success', message: `${result.result.receipts_generated} recibos generados` })
      router.push('/backend/condo_fees/receipts')
    } else {
      flash({ type: 'error', message: 'Error al generar recibos' })
    }
    setIsGenerating(false)
  }

  return (
    <Page>
      <PageBody>
        <div className="mb-4 flex items-center gap-3">
          <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/condo_fees')}>
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-2xl font-bold">Nueva Cuota</h1>
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
              <label className="mb-1 block text-sm font-medium">Nombre *</label>
              <Input
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Cuota Ordinaria Junio 2026"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Tipo *</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={form.fee_type}
                onChange={(e) => updateField('fee_type', e.target.value)}
              >
                <option value="ordinary">Ordinaria</option>
                <option value="extraordinary">Extraordinaria</option>
                <option value="special">Especial</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Período *</label>
              <Input
                value={form.period_month}
                onChange={(e) => updateField('period_month', e.target.value)}
                placeholder="2026-06"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Distribución *</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={form.distribution_method}
                onChange={(e) => updateField('distribution_method', e.target.value)}
              >
                <option value="aliquot">Por Alícuota</option>
                <option value="equal">Partes Iguales</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Monto Base Total (USD) *</label>
              <Input
                value={form.base_amount}
                onChange={(e) => updateField('base_amount', e.target.value)}
                placeholder="1500.00"
                required
              />
              <p className="mt-1 text-xs text-muted-foreground">Monto total del edificio a distribuir</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Fecha Vencimiento *</label>
              <Input
                type="date"
                value={form.due_date}
                onChange={(e) => updateField('due_date', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Moneda</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={form.currency}
                onChange={(e) => updateField('currency', e.target.value)}
              >
                <option value="USD">USD</option>
                <option value="VES">VES</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Recargo por Mora (%)</label>
              <Input
                value={form.late_fee_percent}
                onChange={(e) => updateField('late_fee_percent', e.target.value)}
                placeholder="5"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Días de Gracia</label>
              <Input
                type="number"
                value={form.late_fee_days}
                onChange={(e) => updateField('late_fee_days', Number(e.target.value))}
                min={0}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Notas</label>
            <textarea
              className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              value={form.notes}
              onChange={(e) => updateField('notes', e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => router.push('/backend/condo_fees')}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !!createdId}>
              <Save className="mr-2 size-4" />
              {isSubmitting ? 'Guardando...' : 'Crear Cuota'}
            </Button>
            {createdId && (
              <Button type="button" onClick={handleGenerate} disabled={isGenerating}>
                <Zap className="mr-2 size-4" />
                {isGenerating ? 'Generando...' : 'Generar Recibos'}
              </Button>
            )}
          </div>
        </form>
      </PageBody>
    </Page>
  )
}
