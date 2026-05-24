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
type LineItem = { material_name: string; unit: string; ordered_quantity: string; unit_price: string; total_price: string }

export default function CreateMaterialOrderPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [projects, setProjects] = React.useState<ProjectOption[]>([])
  const [lines, setLines] = React.useState<LineItem[]>([
    { material_name: '', unit: '', ordered_quantity: '1', unit_price: '0', total_price: '0' },
  ])
  const [form, setForm] = React.useState({
    project_id: '',
    supplier_name: '',
    supplier_rif: '',
    order_date: new Date().toISOString().split('T')[0],
    expected_delivery: '',
    currency: 'USD',
    notes: '',
  })

  React.useEffect(() => {
    async function load() {
      const res = await apiCall<{ items: ProjectOption[] }>('/api/const-projects/projects?pageSize=100', undefined, { fallback: { items: [] } })
      if (res.ok) setProjects(res.result?.items ?? [])
    }
    load()
  }, [])

  function set(field: string, value: string) { setForm((p) => ({ ...p, [field]: value })) }

  function updateLine(i: number, field: keyof LineItem, value: string) {
    setLines((prev) => {
      const next = [...prev]
      next[i] = { ...next[i], [field]: value }
      if (field === 'ordered_quantity' || field === 'unit_price') {
        const qty = Number(field === 'ordered_quantity' ? value : next[i].ordered_quantity)
        const price = Number(field === 'unit_price' ? value : next[i].unit_price)
        next[i].total_price = (qty * price).toFixed(2)
      }
      return next
    })
  }

  const grandTotal = React.useMemo(
    () => lines.reduce((s, l) => s + Number(l.total_price), 0),
    [lines],
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)

    const orderResult = await apiCall<{ id: string }>('/api/const-materials/orders', {
      method: 'POST',
      body: JSON.stringify({
        ...form,
        total_amount: grandTotal.toFixed(2),
        supplier_rif: form.supplier_rif || null,
        expected_delivery: form.expected_delivery || null,
        notes: form.notes || null,
      }),
    })

    if (!orderResult.ok) {
      flash('Error al crear la orden de compra', 'error')
      setIsSubmitting(false)
      return
    }

    const orderId = (orderResult.result as any)?.id

    for (const line of lines.filter((l) => l.material_name)) {
      await apiCall('/api/const-materials/order-lines', {
        method: 'POST',
        body: JSON.stringify({ ...line, order_id: orderId }),
      })
    }

    flash('Orden de compra creada exitosamente', 'success')
    router.push('/backend/const_materials/orders')
    setIsSubmitting(false)
  }

  return (
    <Page>
      <PageBody>
        <div className="mb-4 flex items-center gap-3">
          <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/const_materials/orders')}>
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-2xl font-bold">Nueva Orden de Compra</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <fieldset className="max-w-2xl rounded-lg border p-4">
            <legend className="px-2 text-sm font-semibold">Datos del Proveedor</legend>
            <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium">Proyecto *</label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={form.id}
                  onChange={(e) => set('project_id', e.target.value)}
                  required
                >
                  <option value="">Seleccionar...</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Proveedor *</label>
                <Input value={form.supplier_name} onChange={(e) => set('supplier_name', e.target.value)} placeholder="Ferretería Central, C.A." required />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">RIF Proveedor</label>
                <Input value={form.supplier_rif} onChange={(e) => set('supplier_rif', e.target.value)} placeholder="J-12345678-9" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Moneda</label>
                <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={form.currency} onChange={(e) => set('currency', e.target.value)}>
                  <option value="USD">USD</option>
                  <option value="VES">VES</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Fecha OC *</label>
                <Input type="date" value={form.order_date} onChange={(e) => set('order_date', e.target.value)} required />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Entrega Estimada</label>
                <Input type="date" value={form.expected_delivery} onChange={(e) => set('expected_delivery', e.target.value)} />
              </div>
            </div>
          </fieldset>

          {/* Line items */}
          <div className="rounded-lg border p-4">
            <h3 className="mb-3 font-semibold">Materiales a Solicitar</h3>
            {lines.map((l, i) => (
              <div key={i} className="mb-2 grid grid-cols-5 gap-2">
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-medium">Material *</label>
                  <Input className="h-8 text-xs" value={l.material_name}
                    onChange={(e) => updateLine(i, 'material_name', e.target.value)}
                    placeholder="Cemento Portland tipo I" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium">Unid.</label>
                  <Input className="h-8 text-xs" value={l.unit}
                    onChange={(e) => updateLine(i, 'unit', e.target.value)} placeholder="saco" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium">Cantidad</label>
                  <Input className="h-8 text-xs" value={l.ordered_quantity}
                    onChange={(e) => updateLine(i, 'ordered_quantity', e.target.value)} />
                </div>
                <div className="flex gap-1">
                  <div className="flex-1">
                    <label className="mb-1 block text-xs font-medium">P.U.</label>
                    <Input className="h-8 text-xs" value={l.unit_price}
                      onChange={(e) => updateLine(i, 'unit_price', e.target.value)} />
                  </div>
                  {i > 0 && (
                    <Button type="button" variant="ghost" size="sm" className="mt-5 h-8 w-8 p-0 text-destructive"
                      onClick={() => setLines((p) => p.filter((_, j) => j !== i))}>
                      <Trash2 className="size-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            <div className="mt-3 flex items-center justify-between">
              <Button type="button" variant="outline" size="sm"
                onClick={() => setLines((p) => [...p, { material_name: '', unit: '', ordered_quantity: '1', unit_price: '0', total_price: '0' }])}>
                <Plus className="mr-1 size-3" />Agregar Material
              </Button>
              <div className="text-right">
                <span className="text-sm text-muted-foreground">Total: </span>
                <span className="font-mono font-bold text-lg">{form.currency} {grandTotal.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          <div className="max-w-2xl">
            <label className="mb-1 block text-xs font-medium">Observaciones</label>
            <textarea
              className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Condiciones de entrega, especificaciones especiales..."
            />
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => router.push('/backend/const_materials/orders')}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              <Save className="mr-2 size-4" />
              {isSubmitting ? 'Guardando...' : 'Crear Orden de Compra'}
            </Button>
          </div>
        </form>
      </PageBody>
    </Page>
  )
}
