'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import { ArrowLeft, User } from 'lucide-react'

type Props = { params: { orgSlug: string } }


type AccountData = {
  unit: {
    id: string
    unit_number: string
    aliquot_percent: string
    owner_name: string
    building_id: string
  }
  balance: {
    total_debt: string
    pending_receipts: number
    paid_receipts: number
    currency: string
  }
  recent_receipts: {
    id: string
    receipt_number: string
    period_month: string
    total_amount: string
    paid_amount: string
    status: string
    due_date: string
  }[]
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente', partial: 'Parcial',
  paid: 'Pagado', overdue: 'Vencido', cancelled: 'Cancelado',
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline', partial: 'outline', paid: 'secondary',
  overdue: 'destructive', cancelled: 'secondary',
}

export default function PortalAccountPage({ params }: Props) {
  const router = useRouter()
  const [data, setData] = React.useState<AccountData | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [unitId, setUnitId] = React.useState<string | null>(null)

  React.useEffect(() => {
    const url = new URL(window.location.href)
    const uid = url.searchParams.get('unit_id') ?? ''
    setUnitId(uid)
    if (!uid) { setIsLoading(false); return }

    async function load() {
      setIsLoading(true)
      const res = await apiCall<AccountData>(
        `/api/condo-portal/account?unit_id=${uid}`,
        undefined,
        { fallback: null },
      )
      if (res.ok && res.result) setData(res.result)
      setIsLoading(false)
    }
    load()
  }, [])

  const backUrl = unitId ? `/${params.orgSlug}/portal/dashboard?unit_id=${unitId}` : `/${params.orgSlug}/portal/dashboard`

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Cargando...</div>

  if (!data) return (
    <div className="mx-auto max-w-xl p-6">
      <Button type="button" variant="ghost" size="sm" onClick={() => router.push(backUrl)}>
        <ArrowLeft className="mr-2 h-4 w-4" />Volver
      </Button>
      <p className="mt-4 text-muted-foreground">No se encontró información de la unidad.</p>
    </div>
  )

  const hasDebt = Number(data.balance.total_debt) > 0
  const paidTotal = data.recent_receipts
    .filter(r => r.status === 'paid')
    .reduce((s, r) => s + Number(r.total_amount), 0)

  return (
    <div className="mx-auto max-w-xl p-6">
      <div className="mb-6 flex items-center gap-3">
        <Button type="button" variant="ghost" size="sm" onClick={() => router.push(backUrl)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Inicio
        </Button>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <User className="size-5" />
          Mi Estado de Cuenta
        </h1>
      </div>

      {/* Unit info card */}
      <div className="rounded-lg border p-5 mb-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-bold text-lg">Unidad {data.unit.unit_number}</h2>
            <p className="text-muted-foreground text-sm">{data.unit.owner_name}</p>
          </div>
          <Badge variant="outline" className="text-xs">
            Alícuota {Number(data.unit.aliquot_percent).toFixed(5)}%
          </Badge>
        </div>
      </div>

      {/* Balance summary */}
      <div className={`rounded-lg border p-5 mb-6 ${hasDebt ? 'border-destructive/30 bg-destructive/5' : 'border-primary/20 bg-primary/5'}`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Saldo pendiente</p>
            <p className={`text-3xl font-bold ${hasDebt ? 'text-destructive' : 'text-primary'}`}>
              {data.balance.currency} {Number(data.balance.total_debt).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {data.balance.pending_receipts} recibo(s) pendiente(s)
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Pagado (historial)</p>
            <p className="text-lg font-semibold text-primary">
              {data.balance.currency} {paidTotal.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground">{data.balance.paid_receipts} recibo(s)</p>
          </div>
        </div>
      </div>

      {/* Full receipts history */}
      <h3 className="font-semibold text-sm mb-3">Historial completo</h3>
      <div className="space-y-2">
        {data.recent_receipts.map(r => (
          <div key={r.id} className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs">{r.receipt_number}</span>
                <span className="text-sm text-muted-foreground">{r.period_month}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Vence {new Date(r.due_date).toLocaleDateString('es-VE')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="text-sm font-medium">
                  {data.balance.currency} {Number(r.total_amount).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                </div>
                {Number(r.paid_amount) > 0 && Number(r.paid_amount) < Number(r.total_amount) && (
                  <div className="text-xs text-primary">
                    Pagado: {Number(r.paid_amount).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                  </div>
                )}
              </div>
              <Badge variant={STATUS_VARIANTS[r.status] ?? 'outline'} className="text-xs">
                {STATUS_LABELS[r.status] ?? r.status}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
