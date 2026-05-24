'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@open-mercato/ui/primitives/button'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { ArrowLeft } from 'lucide-react'
import { WorkflowApprovalWidget } from '@/lib/workflows/WorkflowApprovalWidget'

type CreditLimit = {
  id: string
  customer_id: string
  credit_limit: string
  currency: string
  current_balance: string
  payment_terms_days: number
  status: string
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Activo', suspended: 'Suspendido', blocked: 'Bloqueado',
}

export default function CreditLimitDetailPage() {
  const params = useParams()
  const router = useRouter()
  const limitId = params?.id as string
  const [limit, setLimit] = React.useState<CreditLimit | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const res = await apiCall<{ items: CreditLimit[] }>(
        `/api/dist-credit/limits?id=${limitId}`,
        undefined,
        { fallback: { items: [] } },
      )
      setLimit(res.result?.items?.[0] ?? null)
      setIsLoading(false)
    }
    if (limitId) load()
  }, [limitId])

  if (isLoading) return <Page><PageBody><p className="text-muted-foreground p-6">Cargando...</p></PageBody></Page>
  if (!limit) return <Page><PageBody><p className="text-muted-foreground p-6">Límite no encontrado.</p></PageBody></Page>

  const available = Math.max(0, Number(limit.credit_limit) - Number(limit.current_balance))

  return (
    <Page>
      <PageBody>
        <div className="flex items-center gap-3 mb-6">
          <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/dist_credit')}>
            <ArrowLeft className="mr-2 size-4" />
            Créditos
          </Button>
          <h1 className="text-xl font-bold">Límite de Crédito</h1>
        </div>

        <div className="max-w-xl space-y-4">
          <div className="rounded-lg border p-5">
            <div className="flex items-start justify-between mb-4">
              <p className="font-semibold">Crédito del distribuidor</p>
              <Badge variant={limit.status === 'active' ? 'default' : 'destructive'}>
                {STATUS_LABELS[limit.status] ?? limit.status}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Límite</p>
                <p className="text-xl font-bold">{limit.currency} {Number(limit.credit_limit).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Saldo usado</p>
                <p className="text-xl font-bold text-destructive">{limit.currency} {Number(limit.current_balance).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Disponible</p>
                <p className="text-xl font-bold text-primary">{limit.currency} {available.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">Plazo: {limit.payment_terms_days} días</p>
          </div>

          {/* Workflow de aprobación de límite de crédito */}
          <WorkflowApprovalWidget
            workflowId="limite_credito_v1"
            entityId={limit.id}
            entityType="DistCreditLimit"
            title="Solicitud de Cambio de Límite"
            startLabel="Solicitar cambio de límite a gerencia"
            startContext={{
              limit_id: limit.id,
              customer_id: limit.customer_id,
              current_limit: limit.credit_limit,
              currency: limit.currency,
            }}
            decisions={[
              { value: 'approve', label: 'Aprobado', variant: 'default' },
              { value: 'approve_conditional', label: 'Aprobado con condiciones', variant: 'outline' },
              { value: 'reject', label: 'Rechazado', variant: 'destructive' },
            ]}
            onCompleted={() => router.refresh()}
          />
        </div>
      </PageBody>
    </Page>
  )
}
