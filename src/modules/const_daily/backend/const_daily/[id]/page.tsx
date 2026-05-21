'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import { LoadingMessage } from '@open-mercato/ui/backend/detail'
import { ArrowLeft, Sun, Cloud, CloudRain, Wind, AlertTriangle, Users, ClipboardList } from 'lucide-react'

type DailyReport = {
  id: string
  report_number: string
  report_date: string
  weather: string
  temperature_high: number | null
  temperature_low: number | null
  work_hours: string
  status: string
  overall_notes: string | null
  safety_incidents: number
  safety_notes: string | null
  submitted_by: string | null
}

type LaborEntry = {
  id: string
  trade: string
  headcount: number
  hours_worked: string
  contractor_name: string | null
  notes: string | null
}

type ActivityEntry = {
  id: string
  area: string
  description: string
  quantity: string | null
  unit: string | null
  percent_complete: string | null
}

const WEATHER_ICONS: Record<string, React.ReactNode> = {
  sunny: React.createElement(Sun, { className: 'size-5 text-status-warning-icon' }),
  cloudy: React.createElement(Cloud, { className: 'size-5 text-muted-foreground' }),
  rainy: React.createElement(CloudRain, { className: 'size-5 text-status-info-icon' }),
  windy: React.createElement(Wind, { className: 'size-5 text-muted-foreground' }),
  foggy: React.createElement(Cloud, { className: 'size-5 text-muted-foreground' }),
}

const WEATHER_LABELS: Record<string, string> = {
  sunny: 'Soleado', cloudy: 'Nublado', rainy: 'Lluvioso', windy: 'Ventoso', foggy: 'Neblina',
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador', submitted: 'Enviado', approved: 'Aprobado',
}

export default function ConstDailyReportDetailPage() {
  const params = useParams()
  const router = useRouter()
  const reportId = params?.id as string

  const [report, setReport] = React.useState<DailyReport | null>(null)
  const [labor, setLabor] = React.useState<LaborEntry[]>([])
  const [activities, setActivities] = React.useState<ActivityEntry[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    if (!reportId) return
    async function load() {
      setIsLoading(true)
      const [rRes, lRes, aRes] = await Promise.all([
        apiCall<{ items: DailyReport[] }>(
          `/api/const-daily/reports?id=${reportId}`,
          undefined,
          { fallback: { items: [] } },
        ),
        apiCall<{ items: LaborEntry[] }>(
          `/api/const-daily/labor?report_id=${reportId}&pageSize=100`,
          undefined,
          { fallback: { items: [] } },
        ),
        apiCall<{ items: ActivityEntry[] }>(
          `/api/const-daily/activities?report_id=${reportId}&pageSize=100`,
          undefined,
          { fallback: { items: [] } },
        ),
      ])
      setReport(rRes.result?.items?.[0] ?? null)
      setLabor(lRes.result?.items ?? [])
      setActivities(aRes.result?.items ?? [])
      setIsLoading(false)
    }
    load()
  }, [reportId])

  if (isLoading) return <LoadingMessage label="Cargando reporte..." />
  if (!report) return (
    <Page>
      <PageBody>
        <Button variant="ghost" size="sm" onClick={() => router.push('/backend/const_daily')}>
          <ArrowLeft className="mr-2 h-4 w-4" />Volver
        </Button>
        <p className="mt-4 text-muted-foreground">Reporte no encontrado.</p>
      </PageBody>
    </Page>
  )

  const totalHeadcount = labor.reduce((s, l) => s + l.headcount, 0)
  const totalHours = labor.reduce((s, l) => s + Number(l.hours_worked), 0)

  return (
    <Page>
      <PageBody>
        <Button variant="ghost" size="sm" onClick={() => router.push('/backend/const_daily')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Reportes diarios
        </Button>

        {/* Header */}
        <div className="mt-4 mb-6 flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{report.report_number}</h1>
              <Badge variant={report.status === 'approved' ? 'secondary' : report.status === 'submitted' ? 'default' : 'outline'}>
                {STATUS_LABELS[report.status] ?? report.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {new Date(report.report_date).toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              {report.submitted_by && ` · ${report.submitted_by}`}
            </p>
          </div>
          {/* Weather badge */}
          <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
            {WEATHER_ICONS[report.weather] ?? null}
            <div>
              <div className="text-sm font-medium">{WEATHER_LABELS[report.weather] ?? report.weather}</div>
              {(report.temperature_high || report.temperature_low) && (
                <div className="text-xs text-muted-foreground">
                  {report.temperature_low !== null ? `${report.temperature_low}°` : ''}{report.temperature_low !== null && report.temperature_high !== null ? ' – ' : ''}{report.temperature_high !== null ? `${report.temperature_high}°C` : ''}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Safety incident alert */}
        {report.safety_incidents > 0 && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <AlertTriangle className="size-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-medium">{report.safety_incidents} incidente(s) de seguridad</span>
              {report.safety_notes && <p className="mt-1 text-destructive/80">{report.safety_notes}</p>}
            </div>
          </div>
        )}

        {/* KPI strip */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="rounded-lg border p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">Personal</div>
            <div className="font-bold text-lg">{totalHeadcount}</div>
            <div className="text-xs text-muted-foreground">trabajadores</div>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">Horas totales</div>
            <div className="font-bold text-lg">{totalHours.toFixed(1)}</div>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">Actividades</div>
            <div className="font-bold text-lg">{activities.length}</div>
          </div>
        </div>

        {/* Labor */}
        {labor.length > 0 && (
          <div className="mb-6">
            <h3 className="flex items-center gap-2 text-sm font-semibold mb-3">
              <Users className="size-4" />
              Personal en obra
            </h3>
            <div className="rounded-lg border overflow-hidden divide-y">
              {labor.map(l => (
                <div key={l.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <div className="font-medium text-sm">{l.trade}</div>
                    {l.contractor_name && <div className="text-xs text-muted-foreground">{l.contractor_name}</div>}
                    {l.notes && <div className="text-xs text-muted-foreground mt-0.5">{l.notes}</div>}
                  </div>
                  <div className="text-right ml-4 shrink-0">
                    <div className="font-semibold">{l.headcount} personas</div>
                    <div className="text-xs text-muted-foreground">{Number(l.hours_worked).toFixed(1)} horas</div>
                  </div>
                </div>
              ))}
              <div className="flex justify-between px-4 py-2 bg-muted/30 text-sm font-medium">
                <span>Total</span>
                <span>{totalHeadcount} personas · {totalHours.toFixed(1)} h</span>
              </div>
            </div>
          </div>
        )}

        {/* Activities */}
        {activities.length > 0 && (
          <div className="mb-6">
            <h3 className="flex items-center gap-2 text-sm font-semibold mb-3">
              <ClipboardList className="size-4" />
              Actividades ejecutadas
            </h3>
            <div className="rounded-lg border overflow-hidden divide-y">
              {activities.map(a => (
                <div key={a.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{a.area}</div>
                      <div className="text-sm text-muted-foreground mt-0.5">{a.description}</div>
                    </div>
                    <div className="text-right shrink-0 space-y-0.5">
                      {a.quantity && a.unit && (
                        <div className="text-sm font-mono">{Number(a.quantity).toLocaleString('es-VE')} {a.unit}</div>
                      )}
                      {a.percent_complete !== null && a.percent_complete !== undefined && (
                        <div className="text-xs text-muted-foreground">{Number(a.percent_complete).toFixed(1)}% completado</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Overall notes */}
        {report.overall_notes && (
          <div className="rounded-lg border p-4">
            <h3 className="text-sm font-semibold mb-2">Observaciones generales</h3>
            <p className="text-sm whitespace-pre-wrap text-muted-foreground">{report.overall_notes}</p>
          </div>
        )}
      </PageBody>
    </Page>
  )
}
