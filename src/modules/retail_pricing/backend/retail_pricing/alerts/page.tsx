'use client'

import * as React from 'react'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import type { ColumnDef } from '@tanstack/react-table'
import { AlertTriangle } from 'lucide-react'

type AlertRow = { id: string; product_id: string; alert_type: string; status: string; current_price: string | null; cost: string | null; current_margin: string | null; message: string | null; created_at: string }

const typeLabels: Record<string, string> = { below_cost: 'Bajo Costo', below_margin: 'Bajo Margen', above_regulated: 'Sobre Regulado', exchange_rate_drift: 'Desfase Tasa' }
const typeVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = { below_cost: 'destructive', below_margin: 'secondary', above_regulated: 'destructive', exchange_rate_drift: 'outline' }

export default function PriceAlertsPage() {
  const [alerts, setAlerts] = React.useState<AlertRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => { loadAlerts() }, [])

  async function loadAlerts() {
    setIsLoading(true)
    const call = await apiCall<{ items: AlertRow[] }>('/api/retail-pricing/alerts?pageSize=100', undefined, { fallback: { items: [] } })
    if (call.ok) setAlerts(call.result?.items ?? [])
    setIsLoading(false)
  }

  async function acknowledge(alertId: string) {
    const call = await apiCall('/api/retail-pricing/alerts', {
      method: 'POST', body: JSON.stringify({ alert_id: alertId }),
    })
    if (call.ok) { flash('Alerta reconocida', 'success'); loadAlerts() }
  }

  const columns: ColumnDef<AlertRow>[] = [
    { accessorKey: 'product_id', header: 'Producto', cell: ({ row }) => <span className="font-mono text-xs">{row.original.product_id.slice(0, 8)}...</span> },
    { accessorKey: 'alert_type', header: 'Tipo', cell: ({ row }) => <Badge variant={typeVariants[row.original.alert_type] ?? 'outline'}>{typeLabels[row.original.alert_type]}</Badge> },
    { accessorKey: 'current_price', header: 'Precio', cell: ({ row }) => <span className="font-mono text-sm">USD {row.original.current_price ?? '—'}</span> },
    { accessorKey: 'cost', header: 'Costo', cell: ({ row }) => <span className="font-mono text-sm text-muted-foreground">USD {row.original.cost ?? '—'}</span> },
    { accessorKey: 'current_margin', header: 'Margen', cell: ({ row }) => {
      const m = row.original.current_margin ? Number(row.original.current_margin) : null
      return m !== null ? <span className={`font-bold ${m < 0 ? 'text-destructive' : ''}`}>{m.toFixed(1)}%</span> : <span>—</span>
    }},
    { accessorKey: 'status', header: 'Estado', cell: ({ row }) => <Badge variant={row.original.status === 'active' ? 'destructive' : 'outline'}>{row.original.status === 'active' ? 'Activa' : 'Reconocida'}</Badge> },
    { accessorKey: 'created_at', header: 'Fecha', cell: ({ row }) => <span className="text-xs text-muted-foreground">{new Date(row.original.created_at).toLocaleDateString('es-VE')}</span> },
    { id: 'actions', header: '', cell: ({ row }) => (
      row.original.status === 'active' ? <Button type="button" variant="ghost" size="sm" onClick={() => acknowledge(row.original.id)}>Reconocer</Button> : null
    )},
  ]

  return (
    <Page>
      <PageBody>
        <div className="mb-6 flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-destructive" />
          <div>
            <h1 className="text-2xl font-bold">Alertas de Precio</h1>
            <p className="text-sm text-muted-foreground">{alerts.filter(a => a.status === 'active').length} alertas activas</p>
          </div>
        </div>
        <DataTable columns={columns} data={alerts} isLoading={isLoading} />
      </PageBody>
    </Page>
  )
}
