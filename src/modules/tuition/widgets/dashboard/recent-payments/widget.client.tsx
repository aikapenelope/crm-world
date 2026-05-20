'use client'

import * as React from 'react'
import type { DashboardWidgetComponentProps } from '@open-mercato/shared/modules/dashboard/widgets'
import { readApiResultOrThrow } from '@open-mercato/ui/backend/utils/apiCall'
import { Spinner } from '@open-mercato/ui/primitives/spinner'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { hydrateSettings, type RecentPaymentsSettings } from './config'

type PaymentRow = {
  id: string
  amount: string
  currency: string
  payment_method_code: string | null
  payment_date: string
  student_id: string
}

const METHOD_LABELS: Record<string, string> = {
  pago_movil: 'P. Móvil',
  zelle: 'Zelle',
  binance: 'Binance',
  transferencia: 'Transf.',
  efectivo_usd: 'Efectivo $',
  efectivo_ves: 'Efectivo Bs',
  debito: 'Débito',
}

const RecentPaymentsWidget: React.FC<DashboardWidgetComponentProps<RecentPaymentsSettings>> = ({
  mode,
  settings,
  onSettingsChange,
  refreshToken,
  onRefreshStateChange,
}) => {
  const value = React.useMemo(() => hydrateSettings(settings), [settings])
  const [payments, setPayments] = React.useState<PaymentRow[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      onRefreshStateChange?.(true)
      setLoading(true)
      try {
        const result = await readApiResultOrThrow<{ items: PaymentRow[] }>(
          `/api/tuition/payments?pageSize=${value.limit}`,
          undefined,
          { errorMessage: 'Error', allowNullResult: true },
        )
        setPayments(result?.items ?? [])
      } finally {
        setLoading(false)
        onRefreshStateChange?.(false)
      }
    }
    load()
  }, [refreshToken, onRefreshStateChange, value.limit])

  if (mode === 'settings') {
    return (
      <div className="space-y-2">
        <label className="text-xs font-medium">Cantidad</label>
        <input
          type="number"
          min={3}
          max={10}
          className="w-20 rounded border px-2 py-1 text-sm"
          value={value.limit}
          onChange={(e) => onSettingsChange({ limit: Number(e.target.value) })}
        />
      </div>
    )
  }

  if (loading) return <div className="flex min-h-[100px] items-center justify-center"><Spinner /></div>

  return (
    <div className="space-y-2">
      {payments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">Sin pagos recientes</p>
      ) : (
        payments.map((p) => (
          <div key={p.id} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {METHOD_LABELS[p.payment_method_code ?? ''] ?? p.payment_method_code ?? '—'}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {new Date(p.payment_date).toLocaleDateString('es-VE')}
              </span>
            </div>
            <span className="font-medium">{p.currency} {Number(p.amount).toLocaleString('es-VE')}</span>
          </div>
        ))
      )}
    </div>
  )
}

export default RecentPaymentsWidget
