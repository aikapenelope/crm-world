'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { Button } from '@open-mercato/ui/primitives/button'
import { Plus, Trash2 } from 'lucide-react'

type Supplier = { id: string; name: string; rif: string | null }
type OrderLine = { product_id: string; quantity_ordered: number; unit_cost: string }

export default function CreatePurchaseOrderPage() {
  const router = useRouter()
  const [suppliers, setSuppliers] = React.useState<Supplier[]>([])
  const [supplierId, setSupplierId] = React.useState('')
  const [currency, setCurrency] = React.useState('USD')
  const [exchangeRate, setExchangeRate] = React.useState('')
  const [notes, setNotes] = React.useState('')
  const [lines, setLines] = React.useState<OrderLine[]>([{ product_id: '', quantity_ordered: 1, unit_cost: '' }])
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    async function load() {
      const call = await apiCall<{ items: Supplier[] }>('/api/retail-purchasing/suppliers?pageSize=100&is_active=true', undefined, { fallback: { items: [] } })
      if (call.ok) setSuppliers(call.result?.items ?? [])
    }
    load()
  }, [])

  function addLine() { setLines([...lines, { product_id: '', quantity_ordered: 1, unit_cost: '' }]) }
  function removeLine(i: number) { setLines(lines.filter((_, idx) => idx !== i)) }
  function updateLine(i: number, field: keyof OrderLine, value: string | number) {
    setLines(lines.map((l, idx) => idx === i ? { ...l, [field]: value } : l))
  }

  const subtotal = lines.reduce((sum, l) => sum + (l.quantity_ordered * Number(l.unit_cost || 0)), 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!supplierId || lines.filter(l => l.product_id && l.unit_cost).length === 0) {
      flash('Selecciona proveedor y agrega productos', 'error')
      return
    }
    setIsSubmitting(true)
    const call = await apiCall('/api/retail-purchasing/orders', {
      method: 'POST',
      body: JSON.stringify({
        supplier_id: supplierId,
        currency,
        exchange_rate: exchangeRate || null,
        notes: notes || null,
        lines: lines.filter(l => l.product_id && l.unit_cost),
      }),
    })
    if (call.ok) {
      flash('Orden de compra creada', 'success')
      router.push('/backend/retail_purchasing')
    } else {
      flash('Error al crear la orden', 'error')
    }
    setIsSubmitting(false)
  }

  return (
    <Page>
      <PageBody>
        <h1 className="text-2xl font-bold mb-6">Nueva Orden de Compra</h1>
        <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Proveedor *</label>
              <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" required>
                <option value="">Seleccionar...</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} {s.rif ? `(${s.rif})` : ''}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Moneda</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm">
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="VES">VES</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tasa de Cambio</label>
              <input type="number" value={exchangeRate} onChange={(e) => setExchangeRate(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" placeholder="Bs/USD" step="0.01" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium">Productos</label>
              <Button type="button" variant="outline" size="sm" onClick={addLine}><Plus className="size-3 mr-1" />Agregar</Button>
            </div>
            <div className="space-y-2">
              {lines.map((line, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg border p-3">
                  <input type="text" value={line.product_id} onChange={(e) => updateLine(i, 'product_id', e.target.value)} className="flex-1 rounded-md border px-2 py-1.5 text-sm font-mono" placeholder="Product ID" />
                  <input type="number" value={line.quantity_ordered} onChange={(e) => updateLine(i, 'quantity_ordered', parseInt(e.target.value) || 1)} className="w-20 rounded-md border px-2 py-1.5 text-sm text-center" min={1} />
                  <input type="text" value={line.unit_cost} onChange={(e) => updateLine(i, 'unit_cost', e.target.value)} className="w-28 rounded-md border px-2 py-1.5 text-sm" placeholder="Costo unit." />
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeLine(i)} disabled={lines.length === 1}><Trash2 className="size-4 text-destructive" /></Button>
                </div>
              ))}
            </div>
            {subtotal > 0 && <p className="text-sm text-right mt-2 font-medium">Subtotal: {currency} {subtotal.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notas</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" rows={2} placeholder="Notas para el proveedor..." />
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creando...' : 'Crear Orden'}</Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
          </div>
        </form>
      </PageBody>
    </Page>
  )
}
