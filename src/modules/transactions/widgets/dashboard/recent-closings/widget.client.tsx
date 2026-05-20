'use client'

import * as React from 'react'
import type { DashboardWidgetComponentProps } from '@open-mercato/shared/modules/dashboard/widgets'
import { readApiResultOrThrow } from '@open-mercato/ui/backend/utils/apiCall'
import { Spinner } from '@open-mercato/ui/primitives/spinner'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Input } from '@open-mercato/ui/primitives/input'
import { hydrateSettings, type RecentClosingsSettings } from './config'

type TransactionRow = {
  id: string
  transaction_type: string
  status: string
  sale_price: string
  currency: string
  commission_amount: string | null
  closing_date: string | null
  created_at: string
}

const RecentClosingsWidget: React.FC<DashboardWidgetComponentProps<RecentClosingsSettings>> = ({
  mode,
  settings,
  onSettingsChange,
  refreshToken,
  onRefreshStateChange,
}) => {
  const value = React.useMemo(() => hydrateSettings(settings), [settings])
  const [items, setItems] = React.useState<TransactionRow[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      onRefreshStateChange?.(true)
      setLoading(true)
      try {
        const params = new URLSearchParams({
          page: '1',
          pageSize: String(value.pageSize),
        })
        if (!value.showPending) params.set('status', 'completed')

        const result = await readApiResultOrThrow<{ items: TransactionRow[] }>(
          `/api/transactions/transactions?${params.toString()}`,
          undefined,
          { errorMessage: 'Error cargando transacciones', allowNullResult: true },
        )
        setItems(result?.items ?? [])
      } finally {
        setLoading(false)
        onRefreshStateChange?.(false)
      }
    }
    load()
  }, [refreshToken, onRefreshStateChange, value.pageSize, value.showPending])

  if (mode === 'settings') {
    return (
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="closings-page-size" className="text-xs font-medium uppercase text-muted-foreground">
            Cantidad a mostrar
          </label>
          <Input
            id="closings-page-size"
            type="number"
            min={1}
            max={20}
            className="w-24"
            value={value.pageSize}
            onChange={(e) => onSettingsChange({ ...value, pageSize: Number(e.target.value) })}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={value.showPending}
            onChange={(e) => onSettingsChange({ ...value, showPending: e.target.checked })}
          />
          Incluir pendientes
        </label>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-[120px] items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">Sin transacciones recientes</p>
      ) : null}
      {items.map((tx) => (
        <div key={tx.id} className="flex items-center justify-between rounded-md border bg-muted/50 px-3 py-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Badge variant={tx.status === 'completed' ? 'default' : 'secondary'}>
                {tx.status === 'completed' ? 'Completada' : 'Pendiente'}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {tx.transaction_type === 'sale' ? 'Venta' : 'Alquiler'}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              {tx.closing_date
                ? new Date(tx.closing_date).toLocaleDateString('es-VE')
                : new Date(tx.created_at).toLocaleDateString('es-VE')}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium">
              {tx.currency} {Number(tx.sale_price).toLocaleString('es-VE')}
            </div>
            {tx.commission_amount && (
              <div className="text-xs text-muted-foreground">
                Com: {tx.currency} {Number(tx.commission_amount).toLocaleString('es-VE')}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default RecentClosingsWidget
