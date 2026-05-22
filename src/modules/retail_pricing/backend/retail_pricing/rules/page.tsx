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

type RuleRow = { id: string; name: string; min_margin_percent: string; target_margin_percent: string | null; channel: string | null; max_regulated_price: string | null; is_active: boolean }

const channelLabels: Record<string, string> = { store: 'Tienda', online: 'Online', wholesale: 'Mayorista' }

export default function PricingRulesPage() {
  const [rules, setRules] = React.useState<RuleRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [showForm, setShowForm] = React.useState(false)
  const [name, setName] = React.useState('')
  const [minMargin, setMinMargin] = React.useState('20')
  const [targetMargin, setTargetMargin] = React.useState('35')
  const [channel, setChannel] = React.useState('')
  const [maxRegulated, setMaxRegulated] = React.useState('')

  React.useEffect(() => { loadRules() }, [])

  async function loadRules() {
    setIsLoading(true)
    const call = await apiCall<{ items: RuleRow[] }>('/api/retail-pricing/rules?pageSize=50', undefined, { fallback: { items: [] } })
    if (call.ok) setRules(call.result?.items ?? [])
    setIsLoading(false)
  }

  async function createRule(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !minMargin) return
    const call = await apiCall('/api/retail-pricing/rules', {
      method: 'POST',
      body: JSON.stringify({
        name,
        min_margin_percent: minMargin,
        target_margin_percent: targetMargin || null,
        channel: channel || null,
        max_regulated_price: maxRegulated || null,
      }),
    })
    if (call.ok) { flash('Regla creada', 'success'); setShowForm(false); setName(''); loadRules() }
  }

  const columns: ColumnDef<RuleRow>[] = [
    { accessorKey: 'name', header: 'Nombre', cell: ({ row }) => <span className="font-medium">{row.original.name}</span> },
    { accessorKey: 'min_margin_percent', header: 'Margen Mín.', cell: ({ row }) => <span className="font-bold">{row.original.min_margin_percent}%</span> },
    { accessorKey: 'target_margin_percent', header: 'Objetivo', cell: ({ row }) => <span className="text-muted-foreground">{row.original.target_margin_percent ? `${row.original.target_margin_percent}%` : '—'}</span> },
    { accessorKey: 'channel', header: 'Canal', cell: ({ row }) => row.original.channel ? <Badge variant="outline">{channelLabels[row.original.channel] ?? row.original.channel}</Badge> : <span className="text-muted-foreground">Todos</span> },
    { accessorKey: 'max_regulated_price', header: 'Precio Regulado', cell: ({ row }) => row.original.max_regulated_price ? <span className="text-destructive font-mono">USD {row.original.max_regulated_price}</span> : <span className="text-muted-foreground">—</span> },
    { accessorKey: 'is_active', header: 'Estado', cell: ({ row }) => <Badge variant={row.original.is_active ? 'default' : 'secondary'}>{row.original.is_active ? 'Activa' : 'Inactiva'}</Badge> },
  ]

  return (
    <Page>
      <PageBody>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Reglas de Margen</h1>
          <Button type="button" onClick={() => setShowForm(!showForm)}><Plus className="mr-2 size-4" />Nueva Regla</Button>
        </div>

        {showForm && (
          <form onSubmit={createRule} className="mb-6 rounded-lg border p-4 max-w-2xl space-y-3">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" placeholder="Nombre (ej: Electrónicos, Alimentos)" required />
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Margen Mín. %</label>
                <input type="number" value={minMargin} onChange={(e) => setMinMargin(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" step="0.01" required />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Objetivo %</label>
                <input type="number" value={targetMargin} onChange={(e) => setTargetMargin(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" step="0.01" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Canal</label>
                <select value={channel} onChange={(e) => setChannel(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm">
                  <option value="">Todos</option>
                  <option value="store">Tienda</option>
                  <option value="online">Online</option>
                  <option value="wholesale">Mayorista</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Precio Regulado</label>
                <input type="number" value={maxRegulated} onChange={(e) => setMaxRegulated(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" step="0.01" placeholder="USD" />
              </div>
            </div>
            <Button type="submit">Crear Regla</Button>
          </form>
        )}

        <DataTable columns={columns} data={rules} isLoading={isLoading} />
      </PageBody>
    </Page>
  )
}
