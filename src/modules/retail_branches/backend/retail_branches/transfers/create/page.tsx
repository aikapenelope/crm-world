'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { Button } from '@open-mercato/ui/primitives/button'
import { Plus, Trash2 } from 'lucide-react'

type Branch = { id: string; name: string; code: string }
type TransferLine = { product_id: string; quantity_requested: number; notes: string }

export default function CreateTransferPage() {
  const router = useRouter()
  const [branches, setBranches] = React.useState<Branch[]>([])
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const [fromBranchId, setFromBranchId] = React.useState('')
  const [toBranchId, setToBranchId] = React.useState('')
  const [notes, setNotes] = React.useState('')
  const [lines, setLines] = React.useState<TransferLine[]>([
    { product_id: '', quantity_requested: 1, notes: '' },
  ])

  React.useEffect(() => {
    async function loadBranches() {
      const call = await apiCall<{ items: Branch[] }>(
        '/api/retail-branches/branches?pageSize=100&is_active=true',
        undefined,
        { fallback: { items: [] } },
      )
      if (call.ok) {
        setBranches(call.result?.items ?? [])
      }
    }
    loadBranches()
  }, [])

  function addLine() {
    setLines([...lines, { product_id: '', quantity_requested: 1, notes: '' }])
  }

  function removeLine(index: number) {
    setLines(lines.filter((_, i) => i !== index))
  }

  function updateLine(index: number, field: keyof TransferLine, value: string | number) {
    setLines(lines.map((line, i) => (i === index ? { ...line, [field]: value } : line)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fromBranchId || !toBranchId || fromBranchId === toBranchId) {
      flash('Selecciona sucursales de origen y destino diferentes', 'error')
      return
    }
    const validLines = lines.filter((l) => l.product_id && l.quantity_requested > 0)
    if (validLines.length === 0) {
      flash('Agrega al menos un producto', 'error')
      return
    }

    setIsSubmitting(true)
    const call = await apiCall('/api/retail-branches/transfers', {
      method: 'POST',
      body: JSON.stringify({
        from_branch_id: fromBranchId,
        to_branch_id: toBranchId,
        notes: notes || null,
        lines: validLines,
      }),
    })

    if (call.ok) {
      flash('Transferencia creada exitosamente', 'success')
      router.push('/backend/retail_branches/transfers')
    } else {
      flash('Error al crear la transferencia', 'error')
    }
    setIsSubmitting(false)
  }

  return (
    <Page>
      <PageBody>
        <h1 className="text-2xl font-bold mb-6">Nueva Transferencia</h1>

        <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
          {/* Branch selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Sucursal Origen *</label>
              <select
                value={fromBranchId}
                onChange={(e) => setFromBranchId(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
                required
              >
                <option value="">Seleccionar...</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Sucursal Destino *</label>
              <select
                value={toBranchId}
                onChange={(e) => setToBranchId(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
                required
              >
                <option value="">Seleccionar...</option>
                {branches.filter((b) => b.id !== fromBranchId).map((b) => (
                  <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Lines */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium">Productos a transferir</label>
              <Button type="button" variant="outline" size="sm" onClick={addLine}>
                <Plus className="size-3 mr-1" />
                Agregar línea
              </Button>
            </div>
            <div className="space-y-2">
              {lines.map((line, index) => (
                <div key={index} className="flex items-center gap-2 rounded-lg border p-3">
                  <input
                    type="text"
                    value={line.product_id}
                    onChange={(e) => updateLine(index, 'product_id', e.target.value)}
                    className="flex-1 rounded-md border px-3 py-1.5 text-sm"
                    placeholder="ID del producto (UUID)"
                  />
                  <input
                    type="number"
                    value={line.quantity_requested}
                    onChange={(e) => updateLine(index, 'quantity_requested', parseInt(e.target.value) || 1)}
                    className="w-20 rounded-md border px-3 py-1.5 text-sm text-center"
                    min={1}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLine(index)}
                    disabled={lines.length === 1}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-1">Notas</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              rows={3}
              placeholder="Notas adicionales sobre la transferencia..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creando...' : 'Crear Transferencia'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
          </div>
        </form>
      </PageBody>
    </Page>
  )
}
