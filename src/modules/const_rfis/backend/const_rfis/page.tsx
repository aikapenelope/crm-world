'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import { Input } from '@open-mercato/ui/primitives/input'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, AlertTriangle, ClipboardCheck } from 'lucide-react'

type RFIRow = {
  id: string
  rfi_number: string
  subject: string
  discipline: string
  priority: string
  status: string
  submitted_by: string
  assigned_to: string | null
  due_date: string | null
  answered_at: string | null
  cost_impact: string | null
  schedule_impact_days: number | null
}

type ProjectOption = { id: string; name: string }

const PRIORITY_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  low: 'secondary', normal: 'outline', high: 'default', urgent: 'destructive',
}

const STATUS_LABELS: Record<string, string> = {
  open: 'Abierta', pending_response: 'Pendiente', answered: 'Respondida',
  closed: 'Cerrada', void: 'Anulada',
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  open: 'destructive', pending_response: 'outline', answered: 'default',
  closed: 'secondary', void: 'secondary',
}

const DISCIPLINE_LABELS: Record<string, string> = {
  civil: 'Civil', architectural: 'Arquitectónico', structural: 'Estructural',
  electrical: 'Eléctrico', mechanical: 'Mecánico', plumbing: 'Sanitario', other: 'Otro',
}

export default function ConstRFIsPage() {
  const router = useRouter()
  const [rfis, setRfis] = React.useState<RFIRow[]>([])
  const [projects, setProjects] = React.useState<ProjectOption[]>([])
  const [selectedProject, setSelectedProject] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(true)
  const [view, setView] = React.useState<'rfis' | 'submittals'>('rfis')
  const [showAnswerModal, setShowAnswerModal] = React.useState<string | null>(null)
  const [answer, setAnswer] = React.useState('')
  const [isAnswering, setIsAnswering] = React.useState(false)

  React.useEffect(() => {
    async function loadProjects() {
      const res = await apiCall<{ items: ProjectOption[] }>('/api/const-projects/projects?pageSize=100', undefined, { fallback: { items: [] } })
      if (res.ok) setProjects(res.result?.items ?? [])
    }
    loadProjects()
  }, [])

  async function loadData() {
    setIsLoading(true)
    const qs = selectedProject ? `?project_id=${selectedProject}` : ''
    const res = await apiCall<{ items: RFIRow[] }>(`/api/const-rfis/rfis${qs}`, undefined, { fallback: { items: [] } })
    if (res.ok) setRfis(res.result?.items ?? [])
    setIsLoading(false)
  }

  React.useEffect(() => { loadData() }, [selectedProject])

  async function submitAnswer() {
    if (!showAnswerModal || !answer.trim()) return
    setIsAnswering(true)
    const result = await apiCall('/api/const-rfis/rfis/answer', {
      method: 'POST',
      body: JSON.stringify({ rfi_id: showAnswerModal, answer }),
    })
    if (result.ok) {
      flash({ type: 'success', message: 'RFI respondido exitosamente' })
      setShowAnswerModal(null)
      setAnswer('')
      await loadData()
    } else {
      flash({ type: 'error', message: 'Error al responder el RFI' })
    }
    setIsAnswering(false)
  }

  const today = new Date().toISOString().split('T')[0]
  const overdueCount = rfis.filter((r) => r.due_date && r.due_date < today && !['answered', 'closed', 'void'].includes(r.status)).length

  const columns: ColumnDef<RFIRow>[] = [
    {
      accessorKey: 'rfi_number',
      header: 'RFI',
      cell: ({ row }) => <span className="font-mono font-bold text-sm">{row.original.rfi_number}</span>,
    },
    {
      accessorKey: 'subject',
      header: 'Asunto',
      cell: ({ row }) => (
        <div>
          <span className="text-sm">{row.original.subject}</span>
          {row.original.due_date && row.original.due_date < today && !['answered', 'closed', 'void'].includes(row.original.status) && (
            <span className="ml-2 text-xs text-destructive">
              <AlertTriangle className="mr-1 inline size-3" />vencido
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'discipline',
      header: 'Disciplina',
      cell: ({ row }) => <Badge variant="outline">{DISCIPLINE_LABELS[row.original.discipline] ?? row.original.discipline}</Badge>,
    },
    {
      accessorKey: 'priority',
      header: 'Prioridad',
      cell: ({ row }) => (
        <Badge variant={PRIORITY_VARIANTS[row.original.priority] ?? 'secondary'}>
          {row.original.priority}
        </Badge>
      ),
    },
    {
      accessorKey: 'assigned_to',
      header: 'Asignado a',
      cell: ({ row }) => <span className="text-xs">{row.original.assigned_to ?? '—'}</span>,
    },
    {
      accessorKey: 'due_date',
      header: 'Vencimiento',
      cell: ({ row }) => {
        const isOverdue = row.original.due_date && row.original.due_date < today && !['answered', 'closed', 'void'].includes(row.original.status)
        return <span className={`text-xs font-mono ${isOverdue ? 'text-destructive font-bold' : ''}`}>{row.original.due_date ?? '—'}</span>
      },
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
        if (['answered', 'closed', 'void'].includes(row.original.status)) return null
        return (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAnswerModal(row.original.id)}
          >
            Responder
          </Button>
        )
      },
    },
  ]

  return (
    <Page>
      <PageBody>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">RFIs y Submittals</h1>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => router.push('/backend/const_rfis/submittals')}>
              <ClipboardCheck className="mr-2 size-4" />
              Submittals
            </Button>
            <Button type="button" onClick={() => setView(view === 'rfis' ? 'submittals' : 'rfis')}>
              <Plus className="mr-2 size-4" />
              Nuevo RFI
            </Button>
          </div>
        </div>

        {/* Filters + KPIs */}
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
          {overdueCount > 0 && (
            <div className="ml-auto flex items-center gap-1 rounded-md bg-destructive/10 px-3 py-1 text-sm text-destructive">
              <AlertTriangle className="size-4" />
              {overdueCount} RFI{overdueCount > 1 ? 's' : ''} vencido{overdueCount > 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
          {['open', 'pending_response', 'answered', 'closed'].map((s) => (
            <div key={s} className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">{STATUS_LABELS[s]}</p>
              <p className={`text-xl font-bold ${s === 'open' ? 'text-destructive' : ''}`}>
                {rfis.filter((r) => r.status === s).length}
              </p>
            </div>
          ))}
          <div className="rounded-lg border bg-destructive/5 p-3">
            <p className="text-xs text-destructive">Vencidos</p>
            <p className="text-xl font-bold text-destructive">{overdueCount}</p>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={rfis}
          isLoading={isLoading}
          searchPlaceholder="Buscar RFI..."
          onRowClick={(row) => router.push(`/backend/const_rfis/${row.id}`)}
        />

        {/* Answer modal */}
        {showAnswerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-lg rounded-lg bg-background p-6">
              <h3 className="mb-3 text-lg font-semibold">Responder RFI</h3>
              <textarea
                className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Escriba la respuesta técnica al RFI..."
              />
              <div className="mt-4 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setShowAnswerModal(null); setAnswer('') }}>
                  Cancelar
                </Button>
                <Button type="button" disabled={!answer.trim() || isAnswering} onClick={submitAnswer}>
                  {isAnswering ? 'Guardando...' : 'Responder'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </PageBody>
    </Page>
  )
}
