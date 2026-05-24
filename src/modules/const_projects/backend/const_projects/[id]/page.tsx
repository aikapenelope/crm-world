'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import { LoadingMessage } from '@open-mercato/ui/backend/detail'
import { ArrowLeft, HardHat, TrendingUp, AlertTriangle, FileText, Clock, Download } from 'lucide-react'

// =============================================================================
// Types
// =============================================================================

type Project = {
  id: string
  name: string
  code: string
  project_type: string
  status: string
  client_name: string
  client_type: string
  contract_amount: string
  currency: string
  overall_progress: string
  start_date: string | null
  planned_end_date: string | null
  project_manager: string | null
  description: string | null
  location: string | null
}

type Valuation = {
  id: string
  valuation_number: string
  period_from: string
  period_to: string
  status: string
  net_payable: string
  currency: string
  approved_by: string | null
}

type RFI = {
  id: string
  rfi_number: string
  subject: string
  status: string
  priority: string
  due_date: string | null
  is_answered: boolean
}

type Tab = 'overview' | 'valuations' | 'rfis'

const STATUS_LABELS: Record<string, string> = {
  prospect: 'Prospecto', bidding: 'Licitación', awarded: 'Adjudicado',
  in_progress: 'En Ejecución', on_hold: 'Pausado', completed: 'Completado', cancelled: 'Cancelado',
}

const VAL_STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador', submitted: 'Enviada', approved: 'Aprobada',
  invoiced: 'Facturada', paid: 'Pagada', rejected: 'Rechazada',
}

const RFI_STATUS_LABELS: Record<string, string> = {
  open: 'Abierta', pending_response: 'Esperando respuesta',
  answered: 'Respondida', closed: 'Cerrada',
}

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Baja', normal: 'Normal', high: 'Alta', urgent: 'Urgente',
}

// =============================================================================
// Component
// =============================================================================

export default function ConstProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params?.id as string
  const [tab, setTab] = React.useState<Tab>('overview')

  const [project, setProject] = React.useState<Project | null>(null)
  const [valuations, setValuations] = React.useState<Valuation[]>([])
  const [rfis, setRfis] = React.useState<RFI[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    if (!projectId) return
    async function load() {
      setIsLoading(true)
      const [projRes, valRes, rfiRes] = await Promise.all([
        apiCall<{ items: Project[] }>(
          `/api/const-projects/projects?id=${projectId}`,
          undefined,
          { fallback: { items: [] } },
        ),
        apiCall<{ items: Valuation[] }>(
          `/api/const-progress/valuations?project_id=${projectId}&pageSize=50`,
          undefined,
          { fallback: { items: [] } },
        ),
        apiCall<{ items: RFI[] }>(
          `/api/const-rfis/rfis?project_id=${projectId}&pageSize=50`,
          undefined,
          { fallback: { items: [] } },
        ),
      ])
      setProject(projRes.result?.items?.[0] ?? null)
      setValuations(valRes.result?.items ?? [])
      setRfis(rfiRes.result?.items ?? [])
      setIsLoading(false)
    }
    load()
  }, [projectId])

  if (isLoading) return <LoadingMessage label="Cargando proyecto..." />
  if (!project) return (
    <Page>
      <PageBody>
        <Button variant="ghost" size="sm" onClick={() => router.push('/backend/const_projects')}>
          <ArrowLeft className="mr-2 h-4 w-4" />Volver
        </Button>
        <p className="mt-4 text-muted-foreground">Proyecto no encontrado.</p>
      </PageBody>
    </Page>
  )

  const progress = Number(project.overall_progress)
  const openRfis = rfis.filter(r => ['open', 'pending_response'].includes(r.status))
  const urgentRfis = rfis.filter(r => r.priority === 'urgent' && r.status !== 'answered' && r.status !== 'closed')
  const billedTotal = valuations
    .filter(v => ['approved', 'invoiced', 'paid'].includes(v.status))
    .reduce((s, v) => s + Number(v.net_payable), 0)

  return (
    <Page>
      <PageBody>
        {/* Back + Header */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.push('/backend/const_projects')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Proyectos
          </Button>
          <div className="mt-3 flex items-start justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold">{project.name}</h1>
                <Badge variant="secondary" className="text-xs">{project.code}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {project.client_name}
                {project.project_manager && ` · Dir: ${project.project_manager}`}
                {project.location && ` · ${project.location}`}
              </p>
            </div>
            <Badge variant={project.status === 'in_progress' ? 'default' : project.status === 'completed' ? 'secondary' : 'outline'}>
              {STATUS_LABELS[project.status] ?? project.status}
            </Badge>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Avance global</span>
              <span className="font-semibold">{progress.toFixed(1)}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${Math.min(100, progress)}%` }}
              />
            </div>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
          <div className="rounded-lg border p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">Contrato</div>
            <div className="font-bold text-sm">
              {project.currency} {Number(project.contract_amount).toLocaleString('es-VE', { minimumFractionDigits: 0 })}
            </div>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">Facturado</div>
            <div className="font-bold text-sm">
              {project.currency} {billedTotal.toLocaleString('es-VE', { minimumFractionDigits: 0 })}
            </div>
            {Number(project.contract_amount) > 0 && (
              <div className="text-xs text-muted-foreground">
                {((billedTotal / Number(project.contract_amount)) * 100).toFixed(1)}%
              </div>
            )}
          </div>
          <div className="rounded-lg border p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">RFIs abiertos</div>
            <div className={`font-bold text-sm ${openRfis.length > 0 ? 'text-status-warning-text' : ''}`}>
              {openRfis.length}
            </div>
            {urgentRfis.length > 0 && (
              <div className="text-xs text-destructive">{urgentRfis.length} urgentes</div>
            )}
          </div>
          <div className="rounded-lg border p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">Fecha fin</div>
            <div className="font-bold text-sm">
              {project.planned_end_date
                ? new Date(project.planned_end_date).toLocaleDateString('es-VE', { day: 'numeric', month: 'short', year: '2-digit' })
                : '—'}
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="border-b mb-6">
          <div className="flex gap-0">
            {([
              { id: 'overview', label: 'Resumen', icon: HardHat },
              { id: 'valuations', title: `Valuaciones (${valuations.length})`, icon: FileText },
              { id: 'rfis', title: `RFIs (${rfis.length})`, icon: AlertTriangle },
            ] as const).map(({ id, label, icon: Icon }) => (
              <Button
                key={id}
                type="button"
                variant="ghost"
                onClick={() => setTab(id as Tab)}
                className={`flex items-center gap-2 px-4 py-2.5 h-auto text-sm border-b-2 rounded-none font-normal transition-colors
                  ${tab === id
                    ? 'border-primary text-primary font-medium'
                    : 'border-transparent text-muted-foreground'
                  }`}
              >
                <Icon className="size-4" />
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Tab: Overview */}
        {tab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg border p-4 space-y-3">
                <h3 className="text-sm font-semibold">Información del proyecto</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo</span>
                    <span>{project.project_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cliente</span>
                    <span className="text-right">{project.client_name}</span>
                  </div>
                  {project.start_date && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Inicio</span>
                      <span>{new Date(project.start_date).toLocaleDateString('es-VE')}</span>
                    </div>
                  )}
                  {project.planned_end_date && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fin planificado</span>
                      <span>{new Date(project.planned_end_date).toLocaleDateString('es-VE')}</span>
                    </div>
                  )}
                </div>
              </div>
              {project.description && (
                <div className="rounded-lg border p-4">
                  <h3 className="text-sm font-semibold mb-2">Descripción</h3>
                  <p className="text-sm text-muted-foreground">{project.description}</p>
                </div>
              )}
            </div>
            {urgentRfis.length > 0 && (
              <div className="rounded-lg border border-status-warning-border bg-status-warning-bg p-4">
                <div className="flex items-center gap-2 text-status-warning-text font-medium text-sm mb-2">
                  <AlertTriangle className="size-4" />
                  {urgentRfis.length} RFI(s) urgente(s) sin respuesta
                </div>
                {urgentRfis.slice(0, 3).map(r => (
                  <div key={r.id} className="text-sm text-status-warning-text">
                    · {r.rfi_number}: {r.subject}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Valuaciones */}
        {tab === 'valuations' && (
          <div>
            {valuations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No hay valuaciones registradas para este proyecto.
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <div className="divide-y">
                  {valuations.map(v => (
                    <div key={v.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <div className="font-medium text-sm">{v.valuation_number}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(v.period_from).toLocaleDateString('es-VE')} → {new Date(v.period_to).toLocaleDateString('es-VE')}
                          {v.approved_by && ` · Aprobado por: ${v.approved_by}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <Badge variant={v.status === 'paid' ? 'secondary' : v.status === 'rejected' ? 'destructive' : 'outline'} className="text-xs">
                          {VAL_STATUS_LABELS[v.status] ?? v.status}
                        </Badge>
                        <span className="font-semibold text-sm whitespace-nowrap">
                          {v.currency} {Number(v.net_payable).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                        </span>
                        <a href={`/api/const-progress/valuations/pdf?id=${v.id}`} target="_blank" rel="noopener noreferrer">
                          <Button type="button" variant="ghost" size="sm" className="h-7 px-2">
                            <Download className="size-3" />
                          </Button>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-3 bg-muted/30 border-t flex justify-between text-sm">
                  <span className="font-medium">Total cobrado</span>
                  <span className="font-bold">
                    {project.currency} {billedTotal.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab: RFIs */}
        {tab === 'rfis' && (
          <div>
            {rfis.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No hay RFIs registrados para este proyecto.
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden divide-y">
                {rfis.map(r => (
                  <div key={r.id} className="flex items-start justify-between px-4 py-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{r.rfi_number}</span>
                        <Badge
                          variant={r.priority === 'urgent' ? 'destructive' : 'outline'}
                          className="text-xs"
                        >
                          {PRIORITY_LABELS[r.priority] ?? r.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{r.subject}</p>
                      {r.due_date && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Clock className="size-3" />
                          Vence: {new Date(r.due_date).toLocaleDateString('es-VE')}
                        </div>
                      )}
                    </div>
                    <Badge
                      variant={r.status === 'answered' || r.status === 'closed' ? 'secondary' : 'outline'}
                      className="text-xs ml-3 shrink-0"
                    >
                      {RFI_STATUS_LABELS[r.status] ?? r.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </PageBody>
    </Page>
  )
}
