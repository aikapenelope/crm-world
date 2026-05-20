'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, PiggyBank, FileBarChart } from 'lucide-react'

type EntryRow = {
  id: string
  entry_type: string
  category: string
  description: string
  amount: string
  currency: string
  entry_date: string
  period_month: string
  is_reserve_fund: boolean
}

type SummaryData = {
  total_income: string
  total_expenses: string
  net_balance: string
  reserve_fund_contributions: string
  currency: string
}

export default function CondoAccountingPage() {
  const router = useRouter()
  const [entries, setEntries] = React.useState<EntryRow[]>([])
  const [summary, setSummary] = React.useState<SummaryData | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const [entriesRes, summaryRes] = await Promise.all([
        apiCall<{ items: EntryRow[] }>('/api/condo-accounting/entries?pageSize=100', undefined, { fallback: { items: [] } }),
        apiCall<SummaryData>('/api/condo-accounting/summary', undefined, { fallback: null }),
      ])
      if (entriesRes.ok) setEntries(entriesRes.result?.items ?? [])
      if (summaryRes.ok && summaryRes.result) setSummary(summaryRes.result)
      setIsLoading(false)
    }
    load()
  }, [])

  const categoryLabels: Record<string, string> = {
    condo_fee: 'Cuota', extraordinary: 'Extraordinario', reserve_fund: 'Fondo Reserva',
    maintenance: 'Mantenimiento', utilities: 'Servicios', payroll: 'Nómina',
    insurance: 'Seguros', legal: 'Legal', other: 'Otro',
  }

  const columns: ColumnDef<EntryRow>[] = [
    {
      accessorKey: 'entry_date',
      header: 'Fecha',
      cell: ({ row }) => row.original.entry_date,
    },
    {
      accessorKey: 'entry_type',
      header: 'Tipo',
      cell: ({ row }) => (
        <Badge variant={row.original.entry_type === 'income' ? 'default' : 'destructive'}>
          {row.original.entry_type === 'income' ? 'Ingreso' : 'Gasto'}
        </Badge>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Categoría',
      cell: ({ row }) => categoryLabels[row.original.category] ?? row.original.category,
    },
    {
      accessorKey: 'description',
      header: 'Descripción',
    },
    {
      accessorKey: 'amount',
      header: 'Monto',
      cell: ({ row }) => (
        <span className={row.original.entry_type === 'income' ? 'font-bold' : 'font-bold text-destructive'}>
          {row.original.entry_type === 'expense' ? '-' : ''}${Number(row.original.amount).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      accessorKey: 'period_month',
      header: 'Período',
    },
  ]

  return (
    <Page>
      <PageBody>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Contabilidad</h1>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => router.push('/backend/condo_accounting/reserve-fund')}>
              <PiggyBank className="mr-2 size-4" />
              Fondo Reserva
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => router.push('/backend/condo_accounting/budgets')}>
              <FileBarChart className="mr-2 size-4" />
              Presupuestos
            </Button>
            <Button type="button" onClick={() => router.push('/backend/condo_accounting/entries/create')}>
              <Plus className="mr-2 size-4" />
              Registrar
            </Button>
          </div>
        </div>

        {summary && (
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Ingresos</p>
              <p className="text-lg font-bold">$ {Number(summary.total_income).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Gastos</p>
              <p className="text-lg font-bold text-destructive">$ {Number(summary.total_expenses).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Balance</p>
              <p className={`text-lg font-bold ${Number(summary.net_balance) >= 0 ? '' : 'text-destructive'}`}>
                $ {Number(summary.net_balance).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Fondo Reserva</p>
              <p className="text-lg font-bold">$ {Number(summary.reserve_fund_contributions).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        )}

        <DataTable
          columns={columns}
          data={entries}
          isLoading={isLoading}
          searchPlaceholder="Buscar movimiento..."
        />
      </PageBody>
    </Page>
  )
}
