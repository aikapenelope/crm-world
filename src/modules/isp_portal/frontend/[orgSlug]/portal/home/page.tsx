'use client'

/**
 * Portal del Abonado — Inicio / Dashboard
 *
 * Patrón oficial Open Mercato:
 *   frontend/[orgSlug]/portal/<path>/page.tsx → /{orgSlug}/portal/<path>
 *   Source: packages/core/src/modules/portal/frontend/[orgSlug]/portal/dashboard/page.tsx
 *
 * El PortalLayoutShell auto-detecta rutas /{orgSlug}/portal/ y las envuelve
 * con la shell del portal (auth, nav, tenant resolution).
 *   Source: src/app/(frontend)/layout.tsx → regex /^\/([^/]+)\/portal(?:\/|$)/
 *
 * La prop `params.orgSlug` es el slug real de la organización del tenant en la BD.
 * Cada tenant tiene su portal en su propio slug: /telecarabobo/portal/home
 */
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@open-mercato/ui/primitives/button'
import { StatusBadge } from '@open-mercato/ui/primitives/status-badge'
import { FileText, MessageCircle, Wifi, DollarSign } from 'lucide-react'

type Props = { params: { orgSlug: string } }

type AccountData = {
  subscriber: {
    account_number: string
    subscriber_type: string
    service_status: string
    installation_city: string
    monthly_price_usd: string
    billing_cycle_day: number
    last_payment_date: string | null
  }
  plan: { name: string; download_mbps: number; upload_mbps: number; technology: string } | null
  balance: { outstanding_usd: string; currency: string }
  open_tickets: number
}

const SERVICE_STATUS_VARIANT: Record<string, 'success' | 'error' | 'warning' | 'info' | 'neutral'> = {
  active: 'success', suspended_overdue: 'error', suspended_voluntary: 'warning',
  pending_installation: 'info', cancelled: 'neutral',
}
const SERVICE_STATUS_LABEL: Record<string, string> = {
  active: 'Servicio activo ✓', suspended_overdue: 'Suspendido — mora pendiente',
  suspended_voluntary: 'Suspendido temporalmente', pending_installation: 'Instalación pendiente',
  cancelled: 'Servicio cancelado',
}

export default function IspPortalHome({ params }: Props) {
  const { orgSlug } = params
  const router = useRouter()
  const [data, setData] = React.useState<AccountData | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const res = await apiCall<AccountData>('/api/isp-portal/account', undefined, { fallback: null })
      if (res.ok && res.result) {
        setData(res.result)
      } else {
        setError('No se pudo cargar tu información. Por favor contacta a soporte.')
      }
      setIsLoading(false)
    }
    load()
  }, [])

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[300px] text-muted-foreground">
      Cargando tu cuenta...
    </div>
  )

  if (error || !data) return (
    <div className="max-w-lg mx-auto p-6 text-center">
      <p className="text-status-error-text mb-4">{error ?? 'No se encontró información de cuenta.'}</p>
      <p className="text-sm text-muted-foreground">Verifica que tu usuario está correctamente vinculado al abonado en el sistema.</p>
    </div>
  )

  const { subscriber, plan, balance, open_tickets } = data
  const hasDebt = parseFloat(balance.outstanding_usd) > 0

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bienvenido</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cuenta {subscriber.account_number} · {subscriber.installation_city}
          </p>
        </div>
        <StatusBadge variant={SERVICE_STATUS_VARIANT[subscriber.service_status] ?? 'neutral'} dot>
          {SERVICE_STATUS_LABEL[subscriber.service_status] ?? subscriber.service_status}
        </StatusBadge>
      </div>

      {/* Balance card */}
      <div className={`rounded-xl border p-6 ${hasDebt ? 'border-status-error-border bg-status-error-bg' : 'border-status-success-border bg-status-success-bg'}`}>
        <p className="text-sm font-medium mb-1">{hasDebt ? 'Saldo pendiente' : 'Al día ✓'}</p>
        <p className={`text-4xl font-bold ${hasDebt ? 'text-status-error-text' : 'text-status-success-text'}`}>
          USD {parseFloat(balance.outstanding_usd).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
        </p>
        {hasDebt && (
          <Button type="button" className="mt-4" onClick={() => router.push(`/${orgSlug}/portal/facturas`)}>
            Ver facturas pendientes
          </Button>
        )}
      </div>

      {/* Plan */}
      {plan && (
        <div className="rounded-lg border border-border p-4 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Wifi className="size-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-medium">{plan.name}</p>
            <p className="text-sm text-muted-foreground">{plan.download_mbps}↓ / {plan.upload_mbps}↑ Mbps · {plan.technology}</p>
          </div>
          <p className="font-semibold">USD {subscriber.monthly_price_usd}/mes</p>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => router.push(`/${orgSlug}/portal/facturas`)}
          className="flex flex-col items-center gap-2 rounded-lg border border-border p-4 hover:bg-accent transition-colors text-sm font-medium">
          <FileText className="size-6 text-primary" />
          Mis Facturas
        </button>
        <button type="button" onClick={() => router.push(`/${orgSlug}/portal/soporte`)}
          className="relative flex flex-col items-center gap-2 rounded-lg border border-border p-4 hover:bg-accent transition-colors text-sm font-medium">
          <MessageCircle className="size-6 text-primary" />
          Soporte
          {open_tickets > 0 && (
            <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-status-error-bg text-status-error-text text-xs font-bold">
              {open_tickets}
            </span>
          )}
        </button>
        <button type="button" onClick={() => router.push(`/${orgSlug}/portal/servicio`)}
          className="flex flex-col items-center gap-2 rounded-lg border border-border p-4 hover:bg-accent transition-colors text-sm font-medium">
          <Wifi className="size-6 text-primary" />
          Mi Servicio
        </button>
        <button type="button" onClick={() => router.push(`/${orgSlug}/portal/soporte/nuevo`)}
          className="flex flex-col items-center gap-2 rounded-lg border border-border p-4 hover:bg-accent transition-colors text-sm font-medium">
          <DollarSign className="size-6 text-primary" />
          Reportar Pago
        </button>
      </div>

      {subscriber.last_payment_date && (
        <p className="text-xs text-center text-muted-foreground">
          Último pago: {new Date(subscriber.last_payment_date).toLocaleDateString('es-VE')}
          {' · '}Vencimiento: día {subscriber.billing_cycle_day} de cada mes
        </p>
      )}
    </div>
  )
}
