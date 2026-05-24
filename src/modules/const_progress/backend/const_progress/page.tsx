'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, CheckCircle, Send, ArrowLeft, CalendarPlus } from 'lucide-react'
import { calendarLinks } from '@/lib/calendar-links'

type ValuationRow = {
  id: string
  project_id: string
  valuation_number: string
  period_from: string
  period_to: string
  status: string
  total_contract: string
  previous_billed: string
  current_period: string
  retention_amount: string
  net_payable: string
  currency: string
  approved_by: string | null
  approved_at: string | null
  exchange_rate: string | null
  amount_ves: string | null
}

type ProjectOption = { id: string; name: string }

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador', submitted: 'Enviada', approved: 'Aprobada',
  invoiced: 'Facturada', paid: 'Pagada', rejected: 'Rechazada',
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'secondary', submitted: 'outline', approved: 'default',
  invoiced: 'default', paid: 'secondary', rejected: 'destructive',
}

export default function ConstProgressPage() {
  const router = useRouter()
  const [valuations, setValuations] = React.useState<ValuationRow[]>([])
  const [projects, setProjects] = React.useState<ProjectOption[]>([])
  const [selectedProject, setSelectedProject] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(true)
  const [actioning, setActioning] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function loadProjects() {
      const res = await apiCall<{ items: ProjectOption[] }>('/api/const-projects/projects?pageSize=100', undefined, { fallback: { items: [] } })
      if (res.ok) setProjects(res.result?.items ?? [])
    }
    loadProjects()
  }, [])

  async function loadValuations() {
    setIsLoading(true)
    const qs = selectedProject ? `?project_id=${selectedProject}` : ''
    const res = await apiCall<{ items: ValuationRow[] }>(`/api/const-progress/valuations${qs}`, undefined, { fallback: { items: [] } })
    if (res.ok) setValuations(res.result?.items ?? [])
    setIsLoading(false)
  }

  React.useEffect(() => { loadValuations() }, [selectedProject])

  async function handleSubmit(id: string) {
    setActioning(id)
    const result = await apiCall('/api/const-progress/valuations/submit', {
      method: 'POST',
      body: JSON.stringify({ valuation_id: id }),
    })
    if (result.ok) {
      flash({ type: 'success', message: 'Valuación enviada para aprobación' })
      await loadValuations()
    } else {
      flash({ type: 'error', message: 'Error al enviar la valuación' })
    }
    setActioning(null)
  }

  async function handleApprove(id: string) {
    setActioning(id)
    const result = await apiCall('/api/const-progress/valuations/approve', {
      method: 'POST',
      body: JSON.stringify({ valuation_id: id }),
    })
    if (result.ok) {
      flash({ type: 'success', message: 'Valuación aprobada' })
      await loadValuations()
    } else {
      flash({ type: 'error', message: 'Error al aprobar la valuación' })
    }
    setActioning(null)
  }

  // Summary
  const summary = React.useMemo(() => {
    const totalBilled = valuations
      .filter((v) => ['approved', 'invoiced', 'paid'].includes(v.status))
      .reduce((s, v) => s + Number(v.current_period), 0)
    const totalRetention = valuations
      .filter((v) => ['approved', 'invoiced', 'paid'].includes(v.status))
      .reduce((s, v) => s + Number(v.retention_amount), 0)
    const totalNetPayable = valuations
      .filter((v) => v.status === 'approved')
      .reduce((s, v) => s + Number(v.net_payable), 0)
    return { totalBilled, totalRetention, totalNetPayable }
  }, [valuations])

  const columns: ColumnDef<ValuationRow>[] = [
    {
      accessorKey: 'valuation_number',
      header: 'Valuación',
      cell: ({ row }) => <span className="font-mono font-bold text-sm">{row.original.valuation_number}</span>,
    },
    {
      id: 'period',
      header: 'Período',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.period_from} → {row.original.period_to}
        </span>
      ),
    },
    {
      accessorKey: 'previous_billed',
      header: 'Anterior',
      cell: ({ row }) => (
        <span className="font-mono text-xs">
          $ {Number(row.original.previous_billed).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      accessorKey: 'current_period',
      header: 'Esta Valuación',
      cell: ({ row }) => (
        <span className="font-mono font-semibold">
          $ {Number(row.original.current_period).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      accessorKey: 'retention_amount',
      header: 'Retención',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-destructive">
          - $ {Number(row.original.retention_amount).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      accessorKey: 'net_payable',
      header: 'Neto a Pagar',
      cell: ({ row }) => (
        <span className="font-mono font-bold text-primary">
          $ {Number(row.original.net_payable).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => (
        <Badge variant={STATUS_VARIANTS[row.original.status] ?? 'secondary'}>
          {STATUS_LABELS[row.original.status] ?? row.original.status}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        if (row.original.status === 'draft') {
          return (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={actioning === row.original.id}
              onClick={() => handleSubmit(row.original.id)}
            >
              <Send className="mr-1 size-3" />
              Enviar
            </Button>
          )
        }
        if (row.original.status === 'submitted') {
          return (
            <Button
              type="button"
              size="sm"
              disabled={actioning === row.original.id}
              onClick={() => handleApprove(row.original.id)}
            >
              <CheckCircle className="mr-1 size-3" />
              Aprobar
            </Button>
          )
        }
        if (row.original.status === 'approved') {
          const meetDate = new Date(row.original.period_to || row.original.period_from)
          meetDate.setDate(meetDate.getDate() + 3)
          meetDate.setHours(10, 0, 0, 0)
          const meetEnd = new Date(meetDate)
          meetEnd.setHours(11, 0, 0, 0)
          const links = calendarLinks({
            title: `Pago Valuación ${row.original.valuation_number}`,
            start: meetDate,
            end: meetEnd,
            description: `Neto a pagar: $${row.original.net_payable} USD\nPeríodo: ${row.original.period_from} → ${row.original.period_to}`,
          })
          return (
            <a href={links.google} target="_blank" rel="noopener noreferrer" title="Agendar pago">
              <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground">
                <CalendarPlus className="mr-1 size-3" />
                Agendar
              </Button>
            </a>
          )
        }
        return null
      },
    },
  ]

  return (
    <Page>
      <PageBody>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/const_projects')}>
              <ArrowLeft className="size-4" />
            </Button>
            <h1 className="text-2xl font-bold">Valuaciones de Obra</h1>
          </div>
          <Button type="button" onClick={() => router.push('/backend/const_progress/create')}>
            <Plus className="mr-2 size-4" />
            Nueva Valuación
          </Button>
        </div>

        {/* Project filter */}
        <div className="mb-4 flex items-center gap-3">
          <label className="text-sm font-medium">Proyecto:</label>
          <select
            className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
          >
            <option value="">Todos</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {/* Summary */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Total Valuaciones</p>
            <p className="text-xl font-bold">{valuations.length}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Facturado Aprobado</p>
            <p className="text-lg font-bold">
              $ {summary.totalBilled.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Retenciones Acumuladas</p>
            <p className="text-lg font-bold text-destructive">
              $ {summary.totalRetention.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Por Pagar (Aprobadas)</p>
            <p className="text-lg font-bold text-primary">
              $ {summary.totalNetPayable.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={valuations}
          isLoading={isLoading}
          searchPlaceholder="Buscar valuación..."
        />
      </PageBody>
    </Page>
  )
}
