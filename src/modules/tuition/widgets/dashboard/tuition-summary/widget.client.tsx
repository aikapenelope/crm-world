'use client'

import * as React from 'react'
import type { DashboardWidgetComponentProps } from '@open-mercato/shared/modules/dashboard/widgets'
import { readApiResultOrThrow } from '@open-mercato/ui/backend/utils/apiCall'
import { Spinner } from '@open-mercato/ui/primitives/spinner'
import { hydrateSettings, type TuitionSummarySettings } from './config'

type ChargeRow = { status: string; amount: string; amount_paid: string }

type Summary = {
  totalCharges: number
  totalAmount: number
  totalPaid: number
  totalPending: number
  totalOverdue: number
  overdueCount: number
  paidCount: number
  pendingCount: number
}

const TuitionSummaryWidget: React.FC<DashboardWidgetComponentProps<TuitionSummarySettings>> = ({
  mode,
  settings,
  onSettingsChange,
  refreshToken,
  onRefreshStateChange,
}) => {
  const value = React.useMemo(() => hydrateSettings(settings), [settings])
  const [summary, setSummary] = React.useState<Summary | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      onRefreshStateChange?.(true)
      setLoading(true)
      try {
        // Get current month charges
        const now = new Date()
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
        const result = await readApiResultOrThrow<{ items: ChargeRow[] }>(
          `/api/tuition/charges?pageSize=500&period_month=${currentMonth}`,
          undefined,
          { errorMessage: 'Error cargando cobros', allowNullResult: true },
        )
        const items = result?.items ?? []

        const s: Summary = {
          totalCharges: items.length,
          totalAmount: 0,
          totalPaid: 0,
          totalPending: 0,
          totalOverdue: 0,
          overdueCount: 0,
          paidCount: 0,
          pendingCount: 0,
        }

        for (const item of items) {
          const amount = Number(item.amount) || 0
          const paid = Number(item.amount_paid) || 0
          s.totalAmount += amount

          if (item.status === 'paid') {
            s.totalPaid += amount
            s.paidCount++
          } else if (item.status === 'overdue') {
            s.totalOverdue += amount
            s.overdueCount++
          } else {
            s.totalPending += amount
            s.pendingCount++
          }
        }

        setSummary(s)
      } finally {
        setLoading(false)
        onRefreshStateChange?.(false)
      }
    }
    load()
  }, [refreshToken, onRefreshStateChange])

  if (mode === 'settings') {
    return (
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={value.showOverdueOnly}
          onChange={(e) => onSettingsChange({ ...value, showOverdueOnly: e.target.checked })}
        />
        Solo mostrar morosos
      </label>
    )
  }

  if (loading || !summary) {
    return (
      <div className="flex min-h-[120px] items-center justify-center">
        <Spinner />
      </div>
    )
  }

  const paidPercentage = summary.totalAmount > 0
    ? Math.round((summary.totalPaid / summary.totalAmount) * 100)
    : 0

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span>Cobrado este mes</span>
          <span>{paidPercentage}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${paidPercentage}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-lg font-bold text-primary">{summary.paidCount}</div>
          <div className="text-xs text-muted-foreground">Pagados</div>
        </div>
        <div>
          <div className="text-lg font-bold text-amber-600">{summary.pendingCount}</div>
          <div className="text-xs text-muted-foreground">Pendientes</div>
        </div>
        <div>
          <div className="text-lg font-bold text-destructive">{summary.overdueCount}</div>
          <div className="text-xs text-muted-foreground">Morosos</div>
        </div>
      </div>

      {/* Totals */}
      <div className="border-t pt-2 space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Meta del mes:</span>
          <span className="font-medium">USD {summary.totalAmount.toLocaleString('es-VE')}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Cobrado:</span>
          <span className="font-medium text-primary">USD {summary.totalPaid.toLocaleString('es-VE')}</span>
        </div>
        {summary.overdueCount > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Moroso:</span>
            <span className="font-medium text-destructive">USD {summary.totalOverdue.toLocaleString('es-VE')}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default TuitionSummaryWidget
