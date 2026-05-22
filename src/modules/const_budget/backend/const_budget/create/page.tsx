/**
 * AGM Exception: raw <form> — dynamic line items
 *
 * This form contains a dynamic array of line items (added/removed at runtime)
 * that CrudForm does not currently support (no repeatable field group).
 * Replacing with CrudForm would require a custom CrudFormGroupComponent
 * that manages its own state for the items array.
 *
 * Acceptable to keep as raw <form> until CrudForm adds native support for
 * repeatable groups, or until a dedicated line-item component is built.
 * All other AGM rules apply (Button components, apiCall, etc.).
 */
'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@open-mercato/ui/primitives/button'
import { Input } from '@open-mercato/ui/primitives/input'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react'

type ProjectOption = { id: string; name: string }
type Resource = { resource_type: string; name: string; unit: string; quantity: string; unit_price: string; total: string }

export default function CreateBudgetItemPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [projects, setProjects] = React.useState<ProjectOption[]>([])
  const [resources, setResources] = React.useState<Resource[]>([])
  const [form, setForm] = React.useState({
    project_id: '',
    item_number: '',
    name: '',
    unit: '',
    quantity: '0',
    unit_cost: '0',
    category: 'civil',
    is_chapter: false,
    level: 1,
    notes: '',
  })

  React.useEffect(() => {
    async function load() {
      const res = await apiCall<{ items: ProjectOption[] }>('/api/const-projects/projects?pageSize=100', undefined, { fallback: { items: [] } })
      if (res.ok) setProjects(res.result?.items ?? [])
    }
    load()
  }, [])

  function set(field: string, value: string | boolean | number) {
    setForm((p) => ({ ...p, [field]: value }))
  }

  function addResource() {
    setResources((p) => [...p, { resource_type: 'material', name: '', unit: '', quantity: '1', unit_price: '0', total: '0' }])
  }

  function updateResource(i: number, field: keyof Resource, value: string) {
    setResources((p) => {
      const next = [...p]
      next[i] = { ...next[i], [field]: value }
      if (field === 'quantity' || field === 'unit_price') {
        const qty = Number(field === 'quantity' ? value : next[i].quantity)
        const price = Number(field === 'unit_price' ? value : next[i].unit_price)
        next[i].total = (qty * price).toFixed(2)
      }
      return next
    })
  }

  function removeResource(i: number) {
    setResources((p) => p.filter((_, idx) => idx !== i))
  }

  // Auto-calculate unit_cost from resources
  const computedUnitCost = React.useMemo(() => {
    return resources.reduce((s, r) => s + Number(r.total), 0).toFixed(4)
  }, [resources])

  const computedTotal = React.useMemo(() => {
    return (Number(form.quantity) * Number(computedUnitCost)).toFixed(2)
  }, [form.quantity, computedUnitCost])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)

    const effectiveUnitCost = resources.length > 0 ? computedUnitCost : form.unit_cost
    const effectiveTotal = resources.length > 0 ? computedTotal : (Number(form.quantity) * Number(form.unit_cost)).toFixed(2)

    // Create item
    const itemResult = await apiCall<{ id: string }>('/api/const-budget/items', {
      method: 'POST',
      body: JSON.stringify({
        ...form,
        unit_cost: effectiveUnitCost,
        total_cost: effectiveTotal,
        unit: form.unit || null,
        notes: form.notes || null,
      }),
    })

    if (!itemResult.ok) {
      flash({ type: 'error', message: 'Error al crear la partida' })
      setIsSubmitting(false)
      return
    }

    const itemId = (itemResult.result as any)?.id

    // Create APU resources
    if (resources.length > 0 && itemId) {
      for (const r of resources) {
        await apiCall('/api/const-budget/resources', {
          method: 'POST',
          body: JSON.stringify({ ...r, budget_item_id: itemId }),
        })
      }
    }

    flash({ type: 'success', message: 'Partida creada exitosamente' })
    router.push('/backend/const_budget')
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
          <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/const_budget')}>
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-2xl font-bold">Nueva Partida / APU</h1>
        </div>

        <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
          <fieldset className="rounded-lg border p-4">
            <legend className="px-2 text-sm font-semibold">Partida</legend>
            <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium">Proyecto *</label>
                {sel('project_id', [{ value: '', label: 'Seleccionar...' }, ...projects.map((p) => ({ value: p.id, label: p.name }))])}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Nº de Ítem *</label>
                <Input value={form.item_number} onChange={(e) => set('item_number', e.target.value)} placeholder="01.02.03" required />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Categoría</label>
                {sel('category', [
                  { value: 'civil', label: 'Civil' },
                  { value: 'electrical', label: 'Eléctrico' },
                  { value: 'mechanical', label: 'Mecánico' },
                  { value: 'architectural', label: 'Arquitectónico' },
                  { value: 'special', label: 'Especial' },
                  { value: 'general', label: 'General' },
                ])}
              </div>
              <div className="md:col-span-3">
                <label className="mb-1 block text-xs font-medium">Descripción *</label>
                <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Concreto f'c=250 kg/cm² en vigas" required />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Unidad</label>
                <Input value={form.unit} onChange={(e) => set('unit', e.target.value)} placeholder="m³, m², ml, kg, un, gl" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Cantidad</label>
                <Input value={form.quantity} onChange={(e) => set('quantity', e.target.value)} placeholder="125.50" />
              </div>
              {resources.length === 0 && (
                <div>
                  <label className="mb-1 block text-xs font-medium">Precio Unitario (USD)</label>
                  <Input value={form.unit_cost} onChange={(e) => set('unit_cost', e.target.value)} placeholder="0.00" />
                </div>
              )}
            </div>

            {resources.length > 0 && (
              <div className="mt-3 rounded-md bg-secondary/30 p-2 text-sm">
                PU calculado del APU: <span className="font-mono font-bold">${computedUnitCost}</span>
                {' '}→ Total: <span className="font-mono font-bold">${computedTotal}</span>
              </div>
            )}
          </fieldset>

          {/* APU Resources */}
          <fieldset className="rounded-lg border p-4">
            <legend className="px-2 text-sm font-semibold">APU — Insumos (opcional)</legend>
            <p className="mb-3 text-xs text-muted-foreground">
              Desglosa el precio unitario en materiales, mano de obra y equipos. El PU se calculará automáticamente.
            </p>

            {resources.map((r, i) => (
              <div key={i} className="mb-2 grid grid-cols-6 gap-2 rounded border p-2">
                <div>
                  <label className="mb-1 block text-xs font-medium">Tipo</label>
                  <select
                    className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs"
                    value={r.resource_type}
                    onChange={(e) => updateResource(i, 'resource_type', e.target.value)}
                  >
                    <option value="material">Material</option>
                    <option value="labor">Mano de Obra</option>
                    <option value="equipment">Equipo</option>
                    <option value="subcontract">Subcontrato</option>
                    <option value="overhead">Indirectos</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-medium">Descripción</label>
                  <Input className="h-8 text-xs" value={r.name} onChange={(e) => updateResource(i, 'name', e.target.value)} placeholder="Cemento Portland tipo I" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium">Unid.</label>
                  <Input className="h-8 text-xs" value={r.unit} onChange={(e) => updateResource(i, 'unit', e.target.value)} placeholder="saco" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium">Cant.</label>
                  <Input className="h-8 text-xs" value={r.quantity} onChange={(e) => updateResource(i, 'quantity', e.target.value)} />
                </div>
                <div className="flex gap-1">
                  <div className="flex-1">
                    <label className="mb-1 block text-xs font-medium">P.U.</label>
                    <Input className="h-8 text-xs" value={r.unit_price} onChange={(e) => updateResource(i, 'unit_price', e.target.value)} />
                  </div>
                  <Button type="button" variant="ghost" size="sm" className="mt-5 h-8 w-8 p-0 text-destructive" onClick={() => removeResource(i)}>
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </div>
            ))}

            <Button type="button" variant="outline" size="sm" onClick={addResource}>
              <Plus className="mr-1 size-3" />
              Agregar Insumo
            </Button>
          </fieldset>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => router.push('/backend/const_budget')}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              <Save className="mr-2 size-4" />
              {isSubmitting ? 'Guardando...' : 'Crear Partida'}
            </Button>
          </div>
        </form>
      </PageBody>
    </Page>
  )
}
