'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, BarChart3, MessageCircle } from 'lucide-react'

type CreditRow = {
  id: string
  customer_id: string
  credit_limit: string
  currency: string
  payment_terms_days: number
  status: string
  current_balance: string
  notes: string | null
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Activo',
  suspended: 'Suspendido',
  blocked: 'Bloqueado',
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  active: 'default',
  suspended: 'secondary',
  blocked: 'destructive',
}

export default function DistCreditPage() {
  const router = useRouter()
  const [limits, setLimits] = React.useState<CreditRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [customerNames, setCustomerNames] = React.useState<Map<string, string>>(new Map())

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const call = await apiCall<{ items: CreditRow[] }>(
        '/api/dist-credit/limits?pageSize=100',
        undefined,
        { fallback: { items: [] } },
      )
      if (call.ok) {
        const items = call.result?.items ?? []
        setLimits(items)

        // Load customer names via customers API
        if (items.length > 0) {
          const namesCall = await apiCall<{ items: { id: string; displayName: string }[] }>(
            '/api/customers/people?pageSize=500',
            undefined,
            { fallback: { items: [] } },
          )
          if (namesCall.ok) {
            const map = new Map<string, string>()
            for (const c of namesCall.result?.items ?? []) {
              map.set(c.id, c.displayName)
            }
            setCustomerNames(map)
          }
        }
      }
      setIsLoading(false)
    }
    load()
  }, [])

  // Summary
  const summary = React.useMemo(() => {
    const totalReceivable = limits.reduce((sum, l) => sum + Number(l.current_balance), 0)
    const totalLimit = limits.reduce((sum, l) => sum + Number(l.credit_limit), 0)
    const activeCount = limits.filter((l) => l.status === 'active').length
    const blockedCount = limits.filter((l) => l.status === 'blocked').length

    return { totalReceivable, totalLimit, activeCount, blockedCount, totalClients: limits.length }
  }, [limits])

  const columns: ColumnDef<CreditRow>[] = [
    {
      accessorKey: 'customer_id',
      header: 'Cliente',
      cell: ({ row }) => (
        <span className="font-medium">
          {customerNames.get(row.original.customer_id) ?? row.original.customer_id.slice(0, 8) + '...'}
        </span>
      ),
    },
    {
      accessorKey: 'credit_limit',
      header: 'Límite',
      cell: ({ row }) => `${row.original.currency} ${Number(row.original.credit_limit).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`,
    },
    {
      accessorKey: 'current_balance',
      header: 'Saldo',
      cell: ({ row }) => {
        const balance = Number(row.original.current_balance)
        return (
          <span className={`font-bold ${balance > 0 ? 'text-foreground' : 'text-primary'}`}>
            {row.original.currency} {balance.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
          </span>
        )
      },
    },
    {
      id: 'utilization',
      header: '% Uso',
      cell: ({ row }) => {
        const balance = Number(row.original.current_balance)
        const limit = Number(row.original.credit_limit)
        const pct = limit > 0 ? Math.round((balance / limit) * 100) : 0
        return (
          <span className={pct > 90 ? 'text-destructive font-medium' : pct > 70 ? 'text-foreground' : 'text-muted-foreground'}>
            {pct}%
          </span>
        )
      },
    },
    {
      accessorKey: 'payment_terms_days',
      header: 'Plazo',
      cell: ({ row }) => `${row.original.payment_terms_days} días`,
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => (
        <Badge variant={STATUS_VARIANTS[row.original.status] ?? 'outline'}>
          {STATUS_LABELS[row.original.status] ?? row.original.status}
        </Badge>
      ),
    },
  ]

  return (
    <Page>
      <PageBody>
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Cuentas por Cobrar</h1>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => router.push('/backend/dist_credit/aging')}>
              <BarChart3 className="mr-2 size-4" />
              Antigüedad
            </Button>
            <Button type="button" variant="outline" size="sm" className="border-[#25D366] text-[#25D366]" onClick={() => router.push('/backend/dist_credit/cobro')}>
              <MessageCircle className="mr-2 size-4" />
              Cobro WhatsApp
            </Button>
            <Button type="button" onClick={() => router.push('/backend/dist_credit/create')}>
              <Plus className="mr-2 size-4" />
              Asignar Crédito
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Total por Cobrar</p>
            <p className="text-lg font-bold">USD {summary.totalReceivable.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Crédito Otorgado</p>
            <p className="text-lg font-bold">USD {summary.totalLimit.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Clientes Activos</p>
            <p className="text-lg font-bold">{summary.activeCount}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Bloqueados</p>
            <p className="text-lg font-bold text-destructive">{summary.blockedCount}</p>
          </div>
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={limits}
          isLoading={isLoading}
          searchPlaceholder="Buscar cliente..."
        />
      </PageBody>
    </Page>
  )
}
