'use client'

import * as React from 'react'
import type { DashboardWidgetComponentProps } from '@open-mercato/shared/modules/dashboard/widgets'
import { readApiResultOrThrow } from '@open-mercato/ui/backend/utils/apiCall'
import { Spinner } from '@open-mercato/ui/primitives/spinner'
import { Checkbox } from '@open-mercato/ui/primitives/checkbox'
import { useT } from '@open-mercato/shared/lib/i18n/context'
import { hydrateSettings, type PipelineSummarySettings } from './config'

type PropertyRow = {
  id: string
  status: string
  operation: string
  price: string
  currency: string
}

type PipelineMetrics = {
  totalActive: number
  totalReserved: number
  ventaCount: number
  alquilerCount: number
  totalValueUsd: number
}

const PipelineSummaryWidget: React.FC<DashboardWidgetComponentProps<PipelineSummarySettings>> = ({
  mode,
  settings,
  onSettingsChange,
  refreshToken,
  onRefreshStateChange,
}) => {
  const t = useT()
  const value = React.useMemo(() => hydrateSettings(settings), [settings])
  const [metrics, setMetrics] = React.useState<PipelineMetrics | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      onRefreshStateChange?.(true)
      setLoading(true)
      try {
        const result = await readApiResultOrThrow<{ items: PropertyRow[] }>(
          '/api/properties/properties?pageSize=500',
          undefined,
          { errorMessage: 'Error cargando pipeline', allowNullResult: true },
        )
        const items = result?.items ?? []

        const active = items.filter((p) => p.status === 'active' || p.status === 'reserved')
        const totalActive = items.filter((p) => p.status === 'active').length
        const totalReserved = items.filter((p) => p.status === 'reserved').length
        const ventaCount = active.filter((p) => p.operation === 'venta' || p.operation === 'venta_alquiler').length
        const alquilerCount = active.filter((p) => p.operation === 'alquiler' || p.operation === 'venta_alquiler').length
        const totalValueUsd = active.reduce((sum, p) => {
          const price = parseFloat(p.price)
          return sum + (isNaN(price) ? 0 : price)
        }, 0)

        setMetrics({ totalActive, totalReserved, ventaCount, alquilerCount, totalValueUsd })
      } finally {
        setLoading(false)
        onRefreshStateChange?.(false)
      }
    }
    load()
  }, [refreshToken, onRefreshStateChange])

  if (mode === 'settings') {
    return (
      <div className="space-y-4">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <Checkbox
            checked={value.showValue}
            onCheckedChange={(checked) => onSettingsChange({ ...value, showValue: !!checked })}
          />
          {t('properties.widget.pipeline.settings.show_value', 'Mostrar valor total del pipeline')}
        </label>
      </div>
    )
  }

  if (loading || !metrics) {
    return (
      <div className="flex min-h-[120px] items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="rounded-md border p-3 text-center">
        <div className="text-2xl font-bold">{metrics.totalActive}</div>
        <div className="text-xs text-muted-foreground">
          {t('properties.widget.pipeline.active', 'Activas')}
        </div>
      </div>
      <div className="rounded-md border p-3 text-center">
        <div className="text-2xl font-bold">{metrics.totalReserved}</div>
        <div className="text-xs text-muted-foreground">
          {t('properties.widget.pipeline.reserved', 'Reservadas')}
        </div>
      </div>
      <div className="rounded-md border p-3 text-center">
        <div className="text-2xl font-bold">{metrics.ventaCount}</div>
        <div className="text-xs text-muted-foreground">
          {t('properties.widget.pipeline.for_sale', 'En venta')}
        </div>
      </div>
      <div className="rounded-md border p-3 text-center">
        <div className="text-2xl font-bold">{metrics.alquilerCount}</div>
        <div className="text-xs text-muted-foreground">
          {t('properties.widget.pipeline.for_rent', 'En alquiler')}
        </div>
      </div>
      {value.showValue && (
        <div className="col-span-2 rounded-md border bg-muted/50 p-3 text-center">
          <div className="text-xl font-bold">
            USD {metrics.totalValueUsd.toLocaleString('es-VE', { maximumFractionDigits: 0 })}
          </div>
          <div className="text-xs text-muted-foreground">
            {t('properties.widget.pipeline.total_value', 'Valor total del pipeline')}
          </div>
        </div>
      )}
    </div>
  )
}

export default PipelineSummaryWidget
