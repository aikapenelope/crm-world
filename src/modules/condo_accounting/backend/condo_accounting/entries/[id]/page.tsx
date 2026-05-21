'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import { LoadingMessage } from '@open-mercato/ui/backend/detail'
import { ArrowLeft, DollarSign } from 'lucide-react'
import { WorkflowApprovalWidget } from '@app/lib/workflows/WorkflowApprovalWidget'

type Entry = {
  id: string; entry_number?: string | null; entry_type: string; category: string
  description: string; amount: string; currency: string; entry_date: string
  entry_status?: string | null; notes?: string | null
}

const ENTRY_TYPE_LABELS: Record<string, string> = {
  expense: 'Gasto', income: 'Ingreso', reserve: 'Reserva', extraordinary: 'Gasto Extraordinario',
}

export default function CondoAccountingEntryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const [entry, setEntry] = React.useState<Entry | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  async function load() {
    setIsLoading(true)
    const res = await apiCall<{ items: Entry[] }>(
      `/api/condo-accounting/entries?id=${id}`, undefined, { fallback: { items: [] } })
    setEntry(res.result?.items?.[0] ?? null)
    setIsLoading(false)
  }

  React.useEffect(() => { if (id) load() }, [id])

  if (isLoading) return <LoadingMessage label="Cargando entrada contable..." />
  if (!entry) return (
    <Page><PageBody>
      <Button variant="ghost" size="sm" onClick={() => router.push('/backend/condo_accounting')}>
        <ArrowLeft className="mr-2 h-4 w-4" />Volver
      </Button>
      <p className="mt-4 text-muted-foreground">Entrada no encontrada.</p>
    </PageBody></Page>
  )

  const isExtraordinary = entry.entry_type === 'extraordinary'

  return (
    <Page>
      <PageBody>
        <Button variant="ghost" size="sm" onClick={() => router.push('/backend/condo_accounting')}>
          <ArrowLeft className="mr-2 h-4 w-4" />Contabilidad
        </Button>

        <div className="mt-4 mb-6">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{entry.description}</h1>
            {isExtraordinary && (
              <Badge className="bg-status-warning-bg text-status-warning-text border-status-warning-border">
                Extraordinario
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {ENTRY_TYPE_LABELS[entry.entry_type] ?? entry.entry_type}
            {' · '}{entry.category}
            {' · '}{new Date(entry.entry_date).toLocaleDateString('es-VE')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
          {/* Entry details */}
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Detalle del gasto</h3>
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="size-4 text-muted-foreground" />
                <span className="text-2xl font-bold">
                  {entry.currency} {Number(entry.amount).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                </span>
              </div>
              {entry.notes && (
                <p className="text-sm text-muted-foreground mt-2">{entry.notes}</p>
              )}
            </div>
          </div>

          {/* Workflow approval (only for extraordinary expenses) */}
          {isExtraordinary && (
            <div>
              <WorkflowApprovalWidget
                workflowId="gasto_extraordinario_v1"
                entityId={entry.id}
                entityType="CondoAccountingEntry"
                title="Aprobación de Gasto Extraordinario"
                startLabel="Solicitar aprobación de la junta"
                startContext={{ description: entry.description, amount: entry.amount, currency: entry.currency }}
                decisions={[
                  { value: 'approve', label: 'Junta aprueba', variant: 'default' },
                  { value: 'reject', label: 'Junta rechaza', variant: 'destructive' },
                ]}
                onCompleted={load}
              />
            </div>
          )}
        </div>
      </PageBody>
    </Page>
  )
}
