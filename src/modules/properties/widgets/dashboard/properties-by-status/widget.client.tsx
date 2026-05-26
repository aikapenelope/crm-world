'use client'

import * as React from 'react'
import type { DashboardWidgetComponentProps } from '@open-mercato/shared/modules/dashboard/widgets'
import { readApiResultOrThrow } from '@open-mercato/ui/backend/utils/apiCall'
import { Spinner } from '@open-mercato/ui/primitives/spinner'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Checkbox } from '@open-mercato/ui/primitives/checkbox'
import { useT } from '@open-mercato/shared/lib/i18n/context'
import { hydrateSettings, type PropertiesByStatusSettings } from './config'

type PropertyRow = {
  id: string
  status: string
}

type StatusCount = {
  status: string
  label: string
  count: number
  variant: 'default' | 'secondary' | 'outline' | 'destructive'
}

const STATUS_CONFIG: Record<string, { label: string; variant: StatusCount['variant'] }> = {
  draft: { label: 'Borrador', variant: 'outline' },
  active: { label: 'Activa', variant: 'default' },
  reserved: { label: 'Reservada', variant: 'secondary' },
  sold: { label: 'Vendida', variant: 'default' },
  rented: { label: 'Alquilada', variant: 'default' },
  inactive: { label: 'Inactiva', variant: 'destructive' },
}

const PropertiesByStatusWidget: React.FC<DashboardWidgetComponentProps<PropertiesByStatusSettings>> = ({
  mode,
  settings,
  onSettingsChange,
  refreshToken,
  onRefreshStateChange,
}) => {
  const t = useT()
  const value = React.useMemo(() => hydrateSettings(settings), [settings])
  const [counts, setCounts] = React.useState<StatusCount[]>([])
  const [total, setTotal] = React.useState(0)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      onRefreshStateChange?.(true)
      setLoading(true)
      try {
        const result = await readApiResultOrThrow<{ items: PropertyRow[] }>(
          '/api/properties/properties?pageSize=500',
          undefined,
          { errorMessage: 'Error cargando propiedades', allowNullResult: true },
        )
        const items = result?.items ?? []
        const grouped: Record<string, number> = {}
        for (const item of items) {
          grouped[item.status] = (grouped[item.status] || 0) + 1
        }

        const statusCounts: StatusCount[] = Object.entries(grouped)
          .filter(([status]) => value.showInactive || status !== 'inactive')
          .map(([status, count]) => ({
            status,
            label: STATUS_CONFIG[status]?.label ?? status,
            count,
            variant: STATUS_CONFIG[status]?.variant ?? 'outline',
          }))
          .sort((a, b) => b.count - a.count)

        setCounts(statusCounts)
        setTotal(items.length)
      } finally {
        setLoading(false)
        onRefreshStateChange?.(false)
      }
    }
    load()
  }, [refreshToken, onRefreshStateChange, value.showInactive])

  if (mode === 'settings') {
    return (
      <div className="space-y-4">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <Checkbox
            checked={value.showInactive}
            onCheckedChange={(checked) => onSettingsChange({ ...value, showInactive: !!checked })}
          />
          {t('properties.widget.by_status.settings.show_inactive', 'Mostrar propiedades inactivas')}
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
    <div className="space-y-3">
      <div className="text-2xl font-bold">{total}</div>
      <div className="text-xs text-muted-foreground">
        {t('properties.widget.by_status.total', 'propiedades en total')}
      </div>
      <div className="space-y-2">
        {counts.map((item) => (
          <div key={item.status} className="flex items-center justify-between">
            <Badge variant={item.variant}>{item.label}</Badge>
            <span className="text-sm font-medium">{item.count}</span>
          </div>
        ))}
        {counts.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {t('properties.widget.by_status.empty', 'Sin propiedades registradas')}
          </p>
        )}
      </div>
    </div>
  )
}

export default PropertiesByStatusWidget
