'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { Button } from '@open-mercato/ui/primitives/button'

export default function CreateCountPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [branchId, setBranchId] = React.useState('')
  const [countType, setCountType] = React.useState('full')
  const [plannedDate, setPlannedDate] = React.useState('')
  const [notes, setNotes] = React.useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!branchId || !plannedDate) return

    setIsSubmitting(true)
    const call = await apiCall('/api/retail-inventory/counts', {
      method: 'POST',
      body: JSON.stringify({ branch_id: branchId, count_type: countType, planned_date: plannedDate, notes: notes || null }),
    })
    if (call.ok) {
      flash('Conteo planificado exitosamente', 'success')
      router.push('/backend/retail_inventory/counts')
    } else {
      flash('Error al crear el conteo', 'error')
    }
    setIsSubmitting(false)
  }

  return (
    <Page>
      <PageBody>
        <h1 className="text-2xl font-bold mb-6">Nuevo Conteo de Inventario</h1>
        <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Sucursal *</label>
            <input type="text" value={branchId} onChange={(e) => setBranchId(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm font-mono" placeholder="UUID de la sucursal" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tipo de Conteo</label>
              <select value={countType} onChange={(e) => setCountType(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm">
                <option value="full">Completo</option>
                <option value="partial">Parcial</option>
                <option value="spot_check">Verificación Rápida</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fecha Planificada *</label>
              <input type="date" value={plannedDate} onChange={(e) => setPlannedDate(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notas</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" rows={2} placeholder="Instrucciones para el conteo..." />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creando...' : 'Planificar Conteo'}</Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
          </div>
        </form>
      </PageBody>
    </Page>
  )
}
