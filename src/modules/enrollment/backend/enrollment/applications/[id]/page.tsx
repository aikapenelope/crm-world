'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@open-mercato/ui/primitives/button'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { ArrowLeft } from 'lucide-react'
import { WorkflowApprovalWidget } from '@/lib/workflows/WorkflowApprovalWidget'

type Application = {
  id: string
  application_type: string
  requested_grade: string
  status: string
  created_at: string
  applicant_contact_id: string
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente', under_review: 'En revisión', approved: 'Aprobada',
  waitlisted: 'Lista de espera', rejected: 'Rechazada', enrolled: 'Matriculada',
}
const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  pending: 'outline', under_review: 'default', approved: 'default',
  waitlisted: 'secondary', rejected: 'destructive', enrolled: 'default',
}
const TYPE_LABELS: Record<string, string> = {
  new_student: 'Nuevo estudiante', returning: 'Reingreso', transfer: 'Traslado',
}

export default function ApplicationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const appId = params?.id as string
  const [app, setApp] = React.useState<Application | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const res = await apiCall<{ items: Application[] }>(
        `/api/enrollment/applications?id=${appId}`,
        undefined,
        { fallback: { items: [] } },
      )
      setApp(res.result?.items?.[0] ?? null)
      setIsLoading(false)
    }
    if (appId) load()
  }, [appId])

  if (isLoading) return <Page><PageBody><p className="text-muted-foreground p-6">Cargando...</p></PageBody></Page>
  if (!app) return <Page><PageBody><p className="text-muted-foreground p-6">Solicitud no encontrada.</p></PageBody></Page>

  return (
    <Page>
      <PageBody>
        <div className="flex items-center gap-3 mb-6">
          <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/enrollment')}>
            <ArrowLeft className="mr-2 size-4" />
            Inscripciones
          </Button>
          <h1 className="text-xl font-bold">Solicitud de Inscripción</h1>
        </div>

        <div className="max-w-xl space-y-4">
          <div className="rounded-lg border p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold">{TYPE_LABELS[app.application_type] ?? app.application_type}</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Grado solicitado: <span className="font-medium">{app.requested_grade}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(app.created_at).toLocaleDateString('es-VE', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <Badge variant={STATUS_VARIANTS[app.status] ?? 'outline'}>
                {STATUS_LABELS[app.status] ?? app.status}
              </Badge>
            </div>
          </div>

          {/* Workflow de admisión — comité revisa y decide */}
          <WorkflowApprovalWidget
            workflowId="inscripcion_escolar_v1"
            entityId={app.id}
            entityType="EnrollmentApplication"
            title="Decisión del Comité de Admisiones"
            startLabel="Enviar al comité de admisiones"
            startContext={{
              application_id: app.id,
              application_type: app.application_type,
              requested_grade: app.requested_grade,
            }}
            decisions={[
              { value: 'approve', label: 'Aprobar inscripción', variant: 'default' },
              { value: 'waitlist', label: 'Lista de espera', variant: 'outline' },
              { value: 'reject', label: 'Rechazar', variant: 'destructive' },
            ]}
            onCompleted={() => router.refresh()}
          />
        </div>
      </PageBody>
    </Page>
  )
}
