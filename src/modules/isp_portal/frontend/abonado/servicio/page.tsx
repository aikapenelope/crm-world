'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@open-mercato/ui/primitives/button'
import { StatusBadge } from '@open-mercato/ui/primitives/status-badge'
import { ArrowLeft, Wifi, MapPin, Calendar } from 'lucide-react'

type AccountData = {
  subscriber: {
    account_number: string
    subscriber_type: string
    service_status: string
    installation_city: string
    monthly_price_usd: string
    billing_cycle_day: number
    activation_date: string | null
  }
  plan: { name: string; download_mbps: number; upload_mbps: number; technology: string; monthly_price_usd: string } | null
}

const STATUS_VARIANT: Record<string, 'success' | 'error' | 'warning' | 'info' | 'neutral'> = {
  active: 'success', suspended_overdue: 'error', suspended_voluntary: 'warning',
  pending_installation: 'info', cancelled: 'neutral',
}
const STATUS_LABEL: Record<string, string> = {
  active: 'Activo', suspended_overdue: 'Suspendido por mora',
  suspended_voluntary: 'Suspendido', pending_installation: 'Pendiente de instalación',
  cancelled: 'Cancelado',
}
const TYPE_LABELS: Record<string, string> = {
  residential: 'Residencial', pyme: 'PYME', corporate: 'Corporativo', wholesale: 'Mayorista',
}
const TECH_LABELS: Record<string, string> = {
  fiber: 'Fibra óptica', wireless: 'Inalámbrico', cable: 'Cable coaxial', dedicated: 'Dedicado',
}

export default function IspPortalServicio() {
  const router = useRouter()
  const [data, setData] = React.useState<AccountData | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const res = await apiCall<AccountData>('/api/isp-portal/account', undefined, { fallback: null })
      if (res.ok && res.result) setData(res.result)
      setIsLoading(false)
    }
    load()
  }, [])

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Cargando...</div>
  if (!data) return <div className="p-8 text-center text-muted-foreground">No se encontró información.</div>

  const { subscriber, plan } = data

  return (
    <div className="mx-auto max-w-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/abonado/home')}>
          <ArrowLeft className="size-4 mr-1" />
        </Button>
        <h1 className="text-2xl font-bold">Mi Servicio</h1>
      </div>

      {/* Service status */}
      <div className="rounded-xl border border-border p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <p className="font-semibold">Estado del servicio</p>
          <StatusBadge variant={STATUS_VARIANT[subscriber.service_status] ?? 'neutral'} dot>
            {STATUS_LABEL[subscriber.service_status] ?? subscriber.service_status}
          </StatusBadge>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Número de cuenta</span>
            <span className="font-mono font-semibold">{subscriber.account_number}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tipo de abonado</span>
            <span>{TYPE_LABELS[subscriber.subscriber_type] ?? subscriber.subscriber_type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Ciudad</span>
            <span className="flex items-center gap-1"><MapPin className="size-3" />{subscriber.installation_city}</span>
          </div>
          {subscriber.activation_date && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Activado el</span>
              <span className="flex items-center gap-1"><Calendar className="size-3" />{new Date(subscriber.activation_date).toLocaleDateString('es-VE')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Plan info */}
      {plan && (
        <div className="rounded-xl border border-border p-5 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Wifi className="size-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">{plan.name}</p>
              <p className="text-xs text-muted-foreground">{TECH_LABELS[plan.technology] ?? plan.technology}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-3 rounded-lg bg-muted/30">
              <p className="text-2xl font-bold text-primary">{plan.download_mbps}</p>
              <p className="text-xs text-muted-foreground">Mbps bajada</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30">
              <p className="text-2xl font-bold text-primary">{plan.upload_mbps}</p>
              <p className="text-xs text-muted-foreground">Mbps subida</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Mensualidad</span>
            <span className="font-bold">USD {subscriber.monthly_price_usd}/mes</span>
          </div>
          <p className="text-xs text-center text-muted-foreground mt-2">
            Fecha de corte: día {subscriber.billing_cycle_day} de cada mes
          </p>
        </div>
      )}

      {/* Suspended alert */}
      {subscriber.service_status === 'suspended_overdue' && (
        <div className="rounded-lg border border-status-error-border bg-status-error-bg p-4 text-center">
          <p className="text-sm font-semibold text-status-error-text mb-2">Servicio suspendido por mora</p>
          <p className="text-xs text-status-error-text mb-3">Tienes facturas pendientes. Reporta tu pago para reactivar el servicio.</p>
          <Button type="button" variant="destructive" size="sm" onClick={() => router.push('/abonado/facturas')}>
            Ver facturas y reportar pago
          </Button>
        </div>
      )}
    </div>
  )
}
