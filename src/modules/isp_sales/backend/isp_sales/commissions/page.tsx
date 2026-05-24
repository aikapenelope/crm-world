'use client'

import * as React from 'react'
import { Page, PageBody, PageHeader } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall, apiCallOrThrow } from '@open-mercato/ui/backend/utils/apiCall'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { Button } from '@open-mercato/ui/primitives/button'
import { StatusBadge } from '@open-mercato/ui/primitives/status-badge'
import type { ColumnDef } from '@tanstack/react-table'

type CommissionRow = {
  id: string
  agent_id: string
  subscriber_id: string
  commission_type: string
  amount_usd: string
  period_month: string | null
  status: string
  paid_at: string | null
}

const TYPE_LABELS: Record<string, string> = {
  installation: 'Instalación', retention_3m: 'Retención 3 meses',
  retention_6m: 'Retención 6 meses', upgrade: 'Upgrade de plan',
}
const STATUS_VARIANT: Record<string, 'warning' | 'info' | 'success' | 'neutral'> = {
  pending: 'warning', approved: 'info', paid: 'success', cancelled: 'neutral',
}

export default function CommissionsPage() {
  const [commissions, setCommissions] = React.useState<CommissionRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [selected, setSelected] = React.useState<string[]>([])
  const [approving, setApproving] = React.useState(false)
  const [totalPending, setTotalPending] = React.useState(0)

  const load = React.useCallback(async () => {
    setIsLoading(true)
    const res = await apiCall<{ items: CommissionRow[] }>('/api/isp-sales/commissions?pageSize=100', undefined, { fallback: { items: [] } })
    if (res.ok) {
      const items = res.result?.items ?? []
      setCommissions(items)
      setTotalPending(items.filter((c) => c.status === 'pending').reduce((s, c) => s + parseFloat(c.amount_usd), 0))
    }
    setIsLoading(false)
  }, [])

  React.useEffect(() => { load() }, [load])

  const approvePending = async () => {
    if (approving) return
    setApproving(true)
    try {
      const pendingIds = commissions.filter((c) => c.status === 'pending').map((c) => c.id)
      if (pendingIds.length === 0) return
      await apiCallOrThrow('/api/isp-sales/commissions/approve', {
        method: 'POST',
        body: JSON.stringify({ commission_ids: pendingIds, action: 'approve' }),
      })
      flash(`${pendingIds.length} comisiones aprobadas`, 'success')
      load()
    } catch { flash('Error al aprobar comisiones', 'error') }
    finally { setApproving(false) }
  }

  const columns: ColumnDef<CommissionRow>[] = [
    { accessorKey: 'commission_type', header: 'Tipo', cell: ({ row }) => TYPE_LABELS[row.original.commission_type] ?? row.original.commission_type },
    { accessorKey: 'period_month', header: 'Período', cell: ({ row }) => row.original.period_month ?? '—' },
    { accessorKey: 'amount_usd', header: 'Monto', cell: ({ row }) => <span className="font-semibold">USD {row.original.amount_usd}</span> },
    {
      accessorKey: 'status', header: 'Estado',
      cell: ({ row }) => (
        <StatusBadge variant={STATUS_VARIANT[row.original.status] ?? 'neutral'} dot>
          {row.original.status}
        </StatusBadge>
      ),
    },
    {
      accessorKey: 'paid_at', header: 'Pagada',
      cell: ({ row }) => row.original.paid_at ? new Date(row.original.paid_at).toLocaleDateString('es-VE') : '—',
    },
  ]

  return (
    <Page>
      <PageHeader
        title="Comisiones de Ventas"
        description={totalPending > 0 ? `USD ${totalPending.toFixed(2)} pendientes de aprobación` : undefined}
        actions={
          totalPending > 0 ? (
            <Button type="button" disabled={approving} onClick={approvePending}>
              Aprobar comisiones pendientes
            </Button>
          ) : undefined
        }
      />
      <PageBody>
        <DataTable
          entityId="isp_sales.commission"
          extensionTableId="isp-commissions-list"
          data={commissions}
          columns={columns}
          isLoading={isLoading}
          emptyState='Sin comisiones'
        />
      </PageBody>
    </Page>
  )
}
