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
import { ArrowLeft, Save } from 'lucide-react'

type ProjectOption = { id: string; name: string; contract_amount: string; retention_percent: string; advance_percent: string }
type BudgetItem = { id: string; item_number: string; name: string; unit: string | null; quantity: string; unit_cost: string; total_cost: string }

export default function CreateValuationPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [projects, setProjects] = React.useState<ProjectOption[]>([])
  const [budgetItems, setBudgetItems] = React.useState<BudgetItem[]>([])
  const [lines, setLines] = React.useState<{ item: BudgetItem; prev_qty: string; curr_qty: string }[]>([])
  const [form, setForm] = React.useState({
    project_id: '',
    period_from: '',
    period_to: '',
    previous_billed: '0.00',
    retention_percent: '10',
    advance_deduction: '0.00',
    exchange_rate: '',
    notes: '',
  })

  React.useEffect(() => {
    async function load() {
      const res = await apiCall<{ items: ProjectOption[] }>('/api/const-projects/projects?pageSize=100', undefined, { fallback: { items: [] } })
      if (res.ok) setProjects(res.result?.items ?? [])
    }
    load()
  }, [])

  async function loadBudgetItems(projectId: string) {
    const res = await apiCall<{ items: BudgetItem[] }>(`/api/const-budget/items?project_id=${projectId}&pageSize=500`, undefined, { fallback: { items: [] } })
    if (res.ok) {
      const items = (res.result?.items ?? []).filter((i) => !i.item_number.endsWith('00') && Number(i.quantity) > 0)
      setBudgetItems(items)
      setLines(items.map((item) => ({ item, prev_qty: '0', curr_qty: '0' })))
    }
  }

  function set(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }))
  }

  function updateLine(i: number, field: 'prev_qty' | 'curr_qty', value: string) {
    setLines((p) => {
      const next = [...p]
      next[i] = { ...next[i], [field]: value }
      return next
    })
  }

  // Calculate totals
  const totals = React.useMemo(() => {
    const currentPeriod = lines.reduce((s, l) => {
      return s + Number(l.curr_qty) * Number(l.item.unit_cost)
    }, 0)
    const selectedProject = projects.find((p) => p.id === form.id) ??
      projects.find((p) => p.id === form.id)
    const retPct = Number(form.retention_percent) / 100
    const retention = currentPeriod * retPct
    const netPayable = currentPeriod - retention - Number(form.advance_deduction)
    const contractAmount = selectedProject ? Number(selectedProject.contract_amount) : 0
    return {
      currentPeriod: currentPeriod.toFixed(2),
      retention: retention.toFixed(2),
      netPayable: netPayable.toFixed(2),
      totalContract: contractAmount.toFixed(2),
    }
  }, [lines, form.retention_percent, form.advance_deduction, projects, form.id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)

    const valuationPayload = {
      project_id: form.id,
      period_from: form.period_from,
      period_to: form.period_to,
      status: 'draft',
      total_contract: totals.totalContract,
      previous_billed: form.previous_billed,
      current_period: totals.currentPeriod,
      retention_amount: totals.retention,
      advance_deduction: form.advance_deduction,
      net_payable: totals.netPayable,
      exchange_rate: form.exchange_rate || null,
      notes: form.notes || null,
    }

    const result = await apiCall<{ id: string }>('/api/const-progress/valuations', {
      method: 'POST',
      body: JSON.stringify(valuationPayload),
    })

    if (!result.ok) {
      flash('Error al crear la valuación', 'error')
      setIsSubmitting(false)
      return
    }

    const valuationId = (result.result as any)?.id

    // Create lines
    const activeLines = lines.filter((l) => Number(l.curr_qty) > 0)
    for (const line of activeLines) {
      const currAmount = Number(line.curr_qty) * Number(line.item.unit_cost)
      const accumulatedQty = Number(line.prev_qty) + Number(line.curr_qty)
      const accumulatedPct = Number(line.item.quantity) > 0
        ? (accumulatedQty / Number(line.item.quantity)) * 100
        : 0

      await apiCall('/api/const-progress/valuation-lines', {
        method: 'POST',
        body: JSON.stringify({
          valuation_id: valuationId,
          budget_item_id: line.item.id,
          item_number: line.item.item_number,
          item_name: line.item.name,
          unit: line.item.unit,
          contracted_quantity: line.item.quantity,
          unit_price: line.item.unit_cost,
          previous_quantity: line.prev_qty,
          current_quantity: line.curr_qty,
          current_amount: currAmount.toFixed(2),
          accumulated_percent: accumulatedPct.toFixed(2),
        }),
      })
    }

    flash('Valuación creada exitosamente', 'success')
    router.push('/backend/const_progress')
    setIsSubmitting(false)
  }

  return (
    <Page>
      <PageBody>
        <div className="mb-4 flex items-center gap-3">
          <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/const_progress')}>
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-2xl font-bold">Nueva Valuación</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <fieldset className="max-w-2xl rounded-lg border p-4">
            <legend className="px-2 text-sm font-semibold">Datos Generales</legend>
            <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium">Proyecto *</label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={form.id}
                  onChange={(e) => {
                    set('project_id', e.target.value)
                    if (e.target.value) loadBudgetItems(e.target.value)
                  }}
                  required
                >
                  <option value="">Seleccionar...</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Retención (%)</label>
                <Input value={form.retention_percent} onChange={(e) => set('retention_percent', e.target.value)} placeholder="10" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Período Desde *</label>
                <Input type="date" value={form.period_from} onChange={(e) => set('period_from', e.target.value)} required />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Período Hasta *</label>
                <Input type="date" value={form.period_to} onChange={(e) => set('period_to', e.target.value)} required />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Cobrado Anterior (USD)</label>
                <Input value={form.previous_billed} onChange={(e) => set('previous_billed', e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Deducción Anticipo (USD)</label>
                <Input value={form.advance_deduction} onChange={(e) => set('advance_deduction', e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Tasa BCV (USD/VES)</label>
                <Input value={form.exchange_rate} onChange={(e) => set('exchange_rate', e.target.value)} placeholder="Ej: 40.50" />
              </div>
            </div>
          </fieldset>

          {/* Budget lines */}
          {budgetItems.length > 0 && (
            <div className="rounded-lg border p-4">
              <h3 className="mb-3 font-semibold">Avance por Partida</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 text-left">Ítem</th>
                      <th className="py-2 text-left">Descripción</th>
                      <th className="py-2 text-right">Contrato</th>
                      <th className="py-2 text-right">PU</th>
                      <th className="py-2 text-right">Cant. Ant.</th>
                      <th className="py-2 text-right">Cant. Esta Val.</th>
                      <th className="py-2 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line, i) => {
                      const amount = Number(line.curr_qty) * Number(line.item.unit_cost)
                      return (
                        <tr key={line.item.id} className="border-b">
                          <td className="py-1 font-mono">{line.item.item_number}</td>
                          <td className="py-1 max-w-xs truncate">{line.item.name}</td>
                          <td className="py-1 text-right font-mono">{Number(line.item.quantity).toLocaleString('es-VE', { minimumFractionDigits: 2 })} {line.item.unit}</td>
                          <td className="py-1 text-right font-mono">${Number(line.item.unit_cost).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
                          <td className="py-1 text-right">
                            <Input
                              className="h-6 w-20 text-right text-xs"
                              value={line.prev_qty}
                              onChange={(e) => updateLine(i, 'prev_qty', e.target.value)}
                            />
                          </td>
                          <td className="py-1 text-right">
                            <Input
                              className="h-6 w-20 text-right text-xs"
                              value={line.curr_qty}
                              onChange={(e) => updateLine(i, 'curr_qty', e.target.value)}
                            />
                          </td>
                          <td className="py-1 text-right font-mono font-bold">
                            ${amount.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot className="border-t-2">
                    <tr>
                      <td colSpan={6} className="py-2 text-right font-bold">Monto Esta Valuación:</td>
                      <td className="py-2 text-right font-bold font-mono text-primary">$ {Number(totals.currentPeriod).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr>
                      <td colSpan={6} className="py-1 text-right text-destructive">Retención ({form.retention_percent}%):</td>
                      <td className="py-1 text-right font-mono text-destructive">- $ {Number(totals.retention).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr className="border-t">
                      <td colSpan={6} className="py-2 text-right font-bold text-lg">Neto a Pagar:</td>
                      <td className="py-2 text-right font-bold font-mono text-lg text-primary">$ {Number(totals.netPayable).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => router.push('/backend/const_progress')}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              <Save className="mr-2 size-4" />
              {isSubmitting ? 'Guardando...' : 'Crear Valuación'}
            </Button>
          </div>
        </form>
      </PageBody>
    </Page>
  )
}
