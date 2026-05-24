'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@open-mercato/ui/primitives/button'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { ArrowLeft } from 'lucide-react'
import { WorkflowApprovalWidget } from '@/lib/workflows/WorkflowApprovalWidget'

type Entry = {
  id: string
  entry_type: string
  category: string
  description: string
  amount: string
  currency: string
  entry_date: string
  period_month: string
  status: string
}

const TYPE_LABELS: Record<string, string> = {
  income: 'Ingreso', expense: 'Egreso', extraordinary: 'Gasto Extraordinario',
  provision: 'Provisión', transfer: 'Transferencia',
}

export default function EntryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const entryId = params?.id as string
  const [entry, setEntry] = React.useState<Entry | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const res = await apiCall<{ items: Entry[] }>(
        `/api/condo-accounting/entries?id=${entryId}`,
        undefined,
        { fallback: { items: [] } },
      )
      setEntry(res.result?.items?.[0] ?? null)
      setIsLoading(false)
    }
    if (entryId) load()
  }, [entryId])

  if (isLoading) return <Page><PageBody><p className="text-muted-foreground p-6">Cargando...</p></PageBody></Page>
  if (!entry) return <Page><PageBody><p className="text-muted-foreground p-6">Movimiento no encontrado.</p></PageBody></Page>

  const isExtraordinary = entry.entry_type === 'extraordinary'

  return (
    <Page>
      <PageBody>
        <div className="flex items-center gap-3 mb-6">
          <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/condo_accounting/entries')}>
            <ArrowLeft className="mr-2 size-4" />
            Movimientos
          </Button>
          <h1 className="text-xl font-bold">{TYPE_LABELS[entry.entry_type] ?? entry.entry_type}</h1>
        </div>

        <div className="max-w-2xl space-y-4">
          <div className="rounded-lg border p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold">{entry.description}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{entry.category} · {entry.period_month}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{entry.currency} {Number(entry.amount).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p>
                <p className="text-xs text-muted-foreground">{new Date(entry.entry_date).toLocaleDateString('es-VE')}</p>
              </div>
            </div>
            <Badge variant={entry.entry_type === 'extraordinary' ? 'destructive' : 'outline'}>
              {TYPE_LABELS[entry.entry_type] ?? entry.entry_type}
            </Badge>
          </div>

          {/* Workflow de aprobación — solo para gastos extraordinarios */}
          {isExtraordinary && (
            <div>
              <WorkflowApprovalWidget
                workflowId="gasto_extraordinario_v1"
                entityId={entry.id}
                entityType="CondoAccountingEntry"
                title="Aprobación de Gasto Extraordinario"
                startLabel="Enviar a votación de la junta"
                startContext={{
                  entry_id: entry.id,
                  description: entry.description,
                  amount_usd: entry.amount,
                  period_month: entry.period_month,
                }}
                decisions={[
                  { value: 'approve', label: 'Aprobado por la junta', variant: 'default' },
                  { value: 'reject', label: 'Rechazado', variant: 'destructive' },
                ]}
                onCompleted={() => router.refresh()}
              />
            </div>
          )}
        </div>
      </PageBody>
    </Page>
  )
}
