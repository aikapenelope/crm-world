/**
 * AGM Exception: raw <form> — inline quick-add pattern
 *
 * This page uses a raw <form> for a small inline creation panel (showForm toggle).
 * CrudForm is designed for full-page create/edit flows and doesn't cleanly support
 * the "toggle-and-submit-in-place" UX pattern this page uses.
 *
 * The inline form is rendered inside the list page with a show/hide toggle button,
 * which provides a faster workflow for operators creating simple records.
 *
 * Migrate to a dedicated create subpage + CrudForm if the form grows beyond ~3 fields
 * or requires validation feedback beyond flash messages.
 */
'use client'

import * as React from 'react'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus } from 'lucide-react'

type PolicyRow = { id: string; name: string; max_days: number; refund_method: string; requires_receipt: boolean; is_active: boolean }

const refundLabels: Record<string, string> = { original: 'Original', credit_note: 'Nota Crédito', store_credit: 'Crédito Tienda', cash: 'Efectivo' }

export default function PoliciesPage() {
  const [policies, setPolicies] = React.useState<PolicyRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [showForm, setShowForm] = React.useState(false)
  const [name, setName] = React.useState('')
  const [maxDays, setMaxDays] = React.useState('30')
  const [refundMethod, setRefundMethod] = React.useState('credit_note')

  React.useEffect(() => {
    loadPolicies()
  }, [])

  async function loadPolicies() {
    setIsLoading(true)
    const call = await apiCall<{ items: PolicyRow[] }>('/api/retail-returns/policies?pageSize=50', undefined, { fallback: { items: [] } })
    if (call.ok) setPolicies(call.result?.items ?? [])
    setIsLoading(false)
  }

  async function createPolicy(e: React.FormEvent) {
    e.preventDefault()
    if (!name) return
    const call = await apiCall('/api/retail-returns/policies', {
      method: 'POST',
      body: JSON.stringify({ name, max_days: parseInt(maxDays), refund_method: refundMethod }),
    })
    if (call.ok) {
      flash('Política creada', 'success')
      setShowForm(false)
      setName('')
      loadPolicies()
    }
  }

  const columns: ColumnDef<PolicyRow>[] = [
    { accessorKey: 'name', header: 'Nombre', cell: ({ row }) => <span className="font-medium">{row.original.name}</span> },
    { accessorKey: 'max_days', header: 'Días Máx.', cell: ({ row }) => <span>{row.original.max_days}d</span> },
    { accessorKey: 'refund_method', header: 'Reembolso', cell: ({ row }) => <Badge variant="outline">{refundLabels[row.original.refund_method] ?? row.original.refund_method}</Badge> },
    { accessorKey: 'requires_receipt', header: 'Recibo', cell: ({ row }) => <span>{row.original.requires_receipt ? 'Sí' : 'No'}</span> },
    { accessorKey: 'is_active', header: 'Estado', cell: ({ row }) => <Badge variant={row.original.is_active ? 'default' : 'secondary'}>{row.original.is_active ? 'Activa' : 'Inactiva'}</Badge> },
  ]

  return (
    <Page>
      <PageBody>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Políticas de Devolución</h1>
          <Button type="button" onClick={() => setShowForm(!showForm)}><Plus className="mr-2 size-4" />Nueva Política</Button>
        </div>

        {showForm && (
          <form onSubmit={createPolicy} className="mb-6 rounded-lg border p-4 max-w-xl space-y-3">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" placeholder="Nombre (ej: Electrónicos, Ropa)" required />
            <div className="grid grid-cols-2 gap-3">
              <input type="number" value={maxDays} onChange={(e) => setMaxDays(e.target.value)} className="rounded-md border px-3 py-2 text-sm" min={1} />
              <select value={refundMethod} onChange={(e) => setRefundMethod(e.target.value)} className="rounded-md border px-3 py-2 text-sm">
                <option value="credit_note">Nota de Crédito</option>
                <option value="store_credit">Crédito en Tienda</option>
                <option value="cash">Efectivo</option>
                <option value="original">Método Original</option>
              </select>
            </div>
            <Button type="submit">Crear</Button>
          </form>
        )}

        <DataTable columns={columns} data={policies} isLoading={isLoading} />
      </PageBody>
    </Page>
  )
}
