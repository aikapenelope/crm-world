'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import { LoadingMessage } from '@open-mercato/ui/backend/detail'
import { ArrowLeft, FileText } from 'lucide-react'
import { WorkflowApprovalWidget } from '@app/lib/workflows/WorkflowApprovalWidget'

type Application = {
  id: string; application_number?: string | null; student_name?: string | null
  applicant_name?: string | null; requested_grade: string; status: string
  period_id: string; created_at: string; notes?: string | null
}

const GRADE_LABELS: Record<string, string> = {
  maternal: 'Maternal', preescolar_1: 'Preescolar I', preescolar_2: 'Preescolar II',
  preescolar_3: 'Preescolar III', primaria_1: '1er Grado', primaria_2: '2do Grado',
  primaria_3: '3er Grado', primaria_4: '4to Grado', primaria_5: '5to Grado',
  primaria_6: '6to Grado', bachillerato_1: '1er Año', bachillerato_2: '2do Año',
  bachillerato_3: '3er Año', bachillerato_4: '4to Año', bachillerato_5: '5to Año',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente', under_review: 'En revisión', approved: 'Aprobada',
  rejected: 'Rechazada', waitlisted: 'Lista de espera', withdrawn: 'Retirada',
}

export default function EnrollmentApplicationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const [app, setApp] = React.useState<Application | null>(null)
  const [periodName, setPeriodName] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(true)

  async function load() {
    setIsLoading(true)
    const res = await apiCall<{ items: Application[] }>(
      `/api/enrollment/applications?id=${id}`, undefined, { fallback: { items: [] } })
    const a = res.result?.items?.[0] ?? null
    setApp(a)

    if (a?.period_id) {
      const pRes = await apiCall<{ items: any[] }>(
        `/api/enrollment/periods?id=${a.period_id}`, undefined, { fallback: { items: [] } })
      setPeriodName(pRes.result?.items?.[0]?.name ?? '')
    }
    setIsLoading(false)
  }

  React.useEffect(() => { if (id) load() }, [id])

  if (isLoading) return <LoadingMessage label="Cargando solicitud..." />
  if (!app) return (
    <Page><PageBody>
      <Button variant="ghost" size="sm" onClick={() => router.push('/backend/enrollment')}>
        <ArrowLeft className="mr-2 h-4 w-4" />Volver
      </Button>
      <p className="mt-4 text-muted-foreground">Solicitud no encontrada.</p>
    </PageBody></Page>
  )

  const studentDisplay = app.student_name ?? app.applicant_name ?? 'Alumno'
  const isActive = ['pending', 'under_review'].includes(app.status)

  return (
    <Page>
      <PageBody>
        <Button variant="ghost" size="sm" onClick={() => router.push('/backend/enrollment')}>
          <ArrowLeft className="mr-2 h-4 w-4" />Inscripciones
        </Button>

        <div className="mt-4 mb-6">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{studentDisplay}</h1>
            <Badge variant={app.status === 'approved' ? 'default' : app.status === 'rejected' ? 'destructive' : 'outline'}>
              {STATUS_LABELS[app.status] ?? app.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {GRADE_LABELS[app.requested_grade] ?? app.requested_grade}
            {periodName && ` · ${periodName}`}
            {' · '}Solicitud del {new Date(app.created_at).toLocaleDateString('es-VE')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
          {/* Application info */}
          <div className="rounded-lg border p-4 space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
              <FileText className="size-3" /> Datos de la Solicitud
            </h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Alumno</span>
                <span className="font-medium">{studentDisplay}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Grado solicitado</span>
                <span className="font-medium">{GRADE_LABELS[app.requested_grade] ?? app.requested_grade}</span>
              </div>
              {periodName && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Período</span>
                  <span className="font-medium">{periodName}</span>
                </div>
              )}
              {app.notes && (
                <div className="pt-2 border-t">
                  <span className="text-muted-foreground">Notas:</span>
                  <p className="text-foreground mt-1">{app.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Workflow approval */}
          {isActive && (
            <div>
              <WorkflowApprovalWidget
                workflowId="inscripcion_escolar_v1"
                entityId={app.id}
                entityType="EnrollmentApplication"
                title="Proceso de Inscripción"
                startLabel="Iniciar revisión de documentos"
                startContext={{
                  student_name: studentDisplay,
                  requested_grade: app.requested_grade,
                  period_id: app.period_id,
                }}
                decisions={[
                  { value: 'complete', label: 'Docs. completos', variant: 'default' },
                  { value: 'incomplete', label: 'Docs. incompletos', variant: 'outline' },
                  { value: 'rejected', label: 'Rechazar', variant: 'destructive' },
                ]}
                onCompleted={load}
              />
            </div>
          )}

          {/* Completed status */}
          {!isActive && (
            <div className="rounded-lg border p-4 flex items-center justify-center">
              <div className="text-center text-sm text-muted-foreground">
                <div className="text-2xl mb-1">{app.status === 'approved' ? '✅' : app.status === 'rejected' ? '❌' : '⏳'}</div>
                Solicitud {STATUS_LABELS[app.status]?.toLowerCase() ?? app.status}
              </div>
            </div>
          )}
        </div>
      </PageBody>
    </Page>
  )
}
