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
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { Button } from '@open-mercato/ui/primitives/button'
import { Plus, Trash2 } from 'lucide-react'

type ReturnLine = { product_id: string; quantity: number; unit_price: string; condition: string }

export default function CreateReturnPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [reason, setReason] = React.useState('defective')
  const [reasonDetail, setReasonDetail] = React.useState('')
  const [refundMethod, setRefundMethod] = React.useState('credit_note')
  const [branchId, setBranchId] = React.useState('')
  const [lines, setLines] = React.useState<ReturnLine[]>([
    { product_id: '', quantity: 1, unit_price: '0.00', condition: 'good' },
  ])

  function addLine() {
    setLines([...lines, { product_id: '', quantity: 1, unit_price: '0.00', condition: 'good' }])
  }

  function removeLine(index: number) {
    setLines(lines.filter((_, i) => i !== index))
  }

  function updateLine(index: number, field: keyof ReturnLine, value: string | number) {
    setLines(lines.map((l, i) => (i === index ? { ...l, [field]: value } : l)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validLines = lines.filter((l) => l.product_id && l.quantity > 0)
    if (validLines.length === 0 || !branchId) {
      flash('Completa los campos requeridos', 'error')
      return
    }

    setIsSubmitting(true)
    const call = await apiCall('/api/retail-returns/returns', {
      method: 'POST',
      body: JSON.stringify({
        branch_id: branchId,
        reason,
        reason_detail: reasonDetail || null,
        refund_method: refundMethod,
        lines: validLines,
      }),
    })

    if (call.ok) {
      flash('Devolución registrada exitosamente', 'success')
      router.push('/backend/retail_returns')
    } else {
      flash('Error al registrar la devolución', 'error')
    }
    setIsSubmitting(false)
  }

  return (
    <Page>
      <PageBody>
        <h1 className="text-2xl font-bold mb-6">Nueva Devolución</h1>

        <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Sucursal *</label>
              <input
                type="text"
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm font-mono"
                placeholder="UUID de la sucursal"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Razón *</label>
              <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm">
                <option value="defective">Defectuoso</option>
                <option value="wrong_item">Producto equivocado</option>
                <option value="not_as_described">No como se describió</option>
                <option value="changed_mind">Cambio de opinión</option>
                <option value="damaged_shipping">Dañado en envío</option>
                <option value="other">Otro</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Método de Reembolso</label>
              <select value={refundMethod} onChange={(e) => setRefundMethod(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm">
                <option value="credit_note">Nota de Crédito</option>
                <option value="store_credit">Crédito en Tienda</option>
                <option value="cash">Efectivo</option>
                <option value="original">Método Original</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Detalle</label>
              <input
                type="text"
                value={reasonDetail}
                onChange={(e) => setReasonDetail(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="Descripción adicional..."
              />
            </div>
          </div>

          {/* Lines */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium">Productos a devolver</label>
              <Button type="button" variant="outline" size="sm" onClick={addLine}>
                <Plus className="size-3 mr-1" /> Agregar
              </Button>
            </div>
            <div className="space-y-2">
              {lines.map((line, index) => (
                <div key={index} className="flex items-center gap-2 rounded-lg border p-3">
                  <input type="text" value={line.product_id} onChange={(e) => updateLine(index, 'product_id', e.target.value)} className="flex-1 rounded-md border px-2 py-1.5 text-sm font-mono" placeholder="Product ID" />
                  <input type="number" value={line.quantity} onChange={(e) => updateLine(index, 'quantity', parseInt(e.target.value) || 1)} className="w-16 rounded-md border px-2 py-1.5 text-sm text-center" min={1} />
                  <input type="text" value={line.unit_price} onChange={(e) => updateLine(index, 'unit_price', e.target.value)} className="w-24 rounded-md border px-2 py-1.5 text-sm" placeholder="USD" />
                  <select value={line.condition} onChange={(e) => updateLine(index, 'condition', e.target.value)} className="w-28 rounded-md border px-2 py-1.5 text-sm">
                    <option value="new">Nuevo</option>
                    <option value="good">Bueno</option>
                    <option value="damaged">Dañado</option>
                    <option value="defective">Defectuoso</option>
                    <option value="unsellable">No vendible</option>
                  </select>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeLine(index)} disabled={lines.length === 1}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Registrando...' : 'Registrar Devolución'}</Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
          </div>
        </form>
      </PageBody>
    </Page>
  )
}
