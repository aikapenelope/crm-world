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
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus } from 'lucide-react'

type SupplierRow = { id: string; name: string; rif: string | null; phone: string | null; currency: string; default_payment_days: number; is_active: boolean }

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = React.useState<SupplierRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [showForm, setShowForm] = React.useState(false)
  const [name, setName] = React.useState('')
  const [rif, setRif] = React.useState('')
  const [phone, setPhone] = React.useState('')

  React.useEffect(() => { loadSuppliers() }, [])

  async function loadSuppliers() {
    setIsLoading(true)
    const call = await apiCall<{ items: SupplierRow[] }>('/api/retail-purchasing/suppliers?pageSize=100', undefined, { fallback: { items: [] } })
    if (call.ok) setSuppliers(call.result?.items ?? [])
    setIsLoading(false)
  }

  async function createSupplier(e: React.FormEvent) {
    e.preventDefault()
    if (!name) return
    const call = await apiCall('/api/retail-purchasing/suppliers', {
      method: 'POST', body: JSON.stringify({ name, rif: rif || null, phone: phone || null }),
    })
    if (call.ok) { flash('Proveedor creado', 'success'); setShowForm(false); setName(''); setRif(''); setPhone(''); loadSuppliers() }
  }

  const columns: ColumnDef<SupplierRow>[] = [
    { accessorKey: 'name', header: 'Nombre', cell: ({ row }) => <span className="font-medium">{row.original.name}</span> },
    { accessorKey: 'rif', header: 'RIF', cell: ({ row }) => <span className="font-mono text-xs">{row.original.rif ?? '—'}</span> },
    { accessorKey: 'phone', header: 'Teléfono', cell: ({ row }) => <span className="text-sm">{row.original.phone ?? '—'}</span> },
    { accessorKey: 'currency', header: 'Moneda', cell: ({ row }) => <Badge variant="outline">{row.original.currency}</Badge> },
    { accessorKey: 'default_payment_days', header: 'Plazo', cell: ({ row }) => <span>{row.original.default_payment_days}d</span> },
    { accessorKey: 'is_active', header: 'Estado', cell: ({ row }) => <Badge variant={row.original.is_active ? 'default' : 'secondary'}>{row.original.is_active ? 'Activo' : 'Inactivo'}</Badge> },
  ]

  return (
    <Page>
      <PageBody>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Proveedores</h1>
          <Button type="button" onClick={() => setShowForm(!showForm)}><Plus className="mr-2 size-4" />Nuevo Proveedor</Button>
        </div>

        {showForm && (
          <form onSubmit={createSupplier} className="mb-6 rounded-lg border p-4 max-w-xl space-y-3">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" placeholder="Nombre del proveedor *" required />
            <div className="grid grid-cols-2 gap-3">
              <input type="text" value={rif} onChange={(e) => setRif(e.target.value)} className="rounded-md border px-3 py-2 text-sm" placeholder="RIF (J-12345678-9)" />
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-md border px-3 py-2 text-sm" placeholder="Teléfono" />
            </div>
            <Button type="submit">Crear</Button>
          </form>
        )}

        <DataTable columns={columns} data={suppliers} isLoading={isLoading} />
      </PageBody>
    </Page>
  )
}
