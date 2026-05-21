'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import { LoadingMessage } from '@open-mercato/ui/backend/detail'
import { ArrowLeft, CreditCard } from 'lucide-react'
import { WorkflowApprovalWidget } from '@app/lib/workflows/WorkflowApprovalWidget'

type CreditAccount = {
  id: string; customer_name: string; credit_limit_usd: string; credit_used_usd: string
  credit_available_usd: string; payment_terms_days: number; status: string; currency: string
  overdue_amount: string; last_payment_date: string | null
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Activa', blocked: 'Bloqueada', suspended: 'Suspendida', inactive: 'Inactiva',
}

export default function DistCreditAccountDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const [account, setAccount] = React.useState<CreditAccount | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  async function load() {
    setIsLoading(true)
    const res = await apiCall<{ items: CreditAccount[] }>(
      `/api/dist-credit/accounts?id=${id}`, undefined, { fallback: { items: [] } })
    setAccount(res.result?.items?.[0] ?? null)
    setIsLoading(false)
  }

  React.useEffect(() => { if (id) load() }, [id])

  if (isLoading) return <LoadingMessage label="Cargando cuenta de crédito..." />
  if (!account) return (
    <Page><PageBody>
      <Button variant="ghost" size="sm" onClick={() => router.push('/backend/dist_credit')}>
        <ArrowLeft className="mr-2 h-4 w-4" />Volver
      </Button>
      <p className="mt-4 text-muted-foreground">Cuenta no encontrada.</p>
    </PageBody></Page>
  )

  const usedPercent = Number(account.credit_limit_usd) > 0
    ? Math.round((Number(account.credit_used_usd) / Number(account.credit_limit_usd)) * 100)
    : 0
  const isOverLimit = usedPercent >= 90

  return (
    <Page>
      <PageBody>
        <Button variant="ghost" size="sm" onClick={() => router.push('/backend/dist_credit')}>
          <ArrowLeft className="mr-2 h-4 w-4" />Crédito
        </Button>

        <div className="mt-4 mb-6 flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{account.customer_name}</h1>
              <Badge variant={account.status === 'active' ? 'default' : account.status === 'blocked' ? 'destructive' : 'outline'}>
                {STATUS_LABELS[account.status] ?? account.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Plazo: {account.payment_terms_days} días
              {account.last_payment_date && ` · Último pago: ${new Date(account.last_payment_date).toLocaleDateString('es-VE')}`}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
          {/* Credit KPIs */}
          <div className="space-y-3">
            <div className="rounded-lg border p-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3 flex items-center gap-1">
                <CreditCard className="size-3" /> Estado de Crédito
              </h3>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-lg font-bold">
                    {account.currency} {Number(account.credit_limit_usd).toLocaleString('es-VE', { minimumFractionDigits: 0 })}
                  </div>
                  <div className="text-xs text-muted-foreground">Límite</div>
                </div>
                <div>
                  <div className={`text-lg font-bold ${isOverLimit ? 'text-destructive' : 'text-primary'}`}>
                    {account.currency} {Number(account.credit_used_usd).toLocaleString('es-VE', { minimumFractionDigits: 0 })}
                  </div>
                  <div className="text-xs text-muted-foreground">Usado</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-[#059669]">
                    {account.currency} {Number(account.credit_available_usd).toLocaleString('es-VE', { minimumFractionDigits: 0 })}
                  </div>
                  <div className="text-xs text-muted-foreground">Disponible</div>
                </div>
              </div>
              {/* Usage bar */}
              <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${isOverLimit ? 'bg-destructive' : 'bg-primary'}`}
                  style={{ width: `${Math.min(100, usedPercent)}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-1 text-right">{usedPercent}% utilizado</div>
            </div>
          </div>

          {/* Workflow approval */}
          <div>
            <WorkflowApprovalWidget
              workflowId="limite_credito_approval_v1"
              entityId={account.id}
              entityType="DistCreditAccount"
              title="Aprobación de Límite de Crédito"
              startLabel="Solicitar aumento de límite"
              startContext={{
                customer_name: account.customer_name,
                current_limit_usd: account.credit_limit_usd,
                payment_terms_days: account.payment_terms_days,
              }}
              decisions={[
                { value: 'approve', label: 'Aprobar', variant: 'default' },
                { value: 'approve_partial', label: 'Aprobar parcial', variant: 'outline' },
                { value: 'reject', label: 'Rechazar', variant: 'destructive' },
              ]}
              onCompleted={load}
            />
          </div>
        </div>
      </PageBody>
    </Page>
  )
}
