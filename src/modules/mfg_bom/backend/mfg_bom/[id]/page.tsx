'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Page, PageBody, PageHeader } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { RowActions } from '@open-mercato/ui/backend/RowActions'
import { apiCall, apiCallOrThrow } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@open-mercato/ui/primitives/button'
import { Input } from '@open-mercato/ui/primitives/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@open-mercato/ui/primitives/select'
import { StatusBadge } from '@open-mercato/ui/primitives/status-badge'
import { LoadingMessage, ErrorMessage } from '@open-mercato/ui/backend/detail'
import { CrudForm } from '@open-mercato/ui/backend/CrudForm'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { useGuardedMutation } from '@open-mercato/ui/backend/injection/useGuardedMutation'
import { ArrowLeft, Plus, Trash2, CheckCircle, GitBranch } from 'lucide-react'
import { WorkflowApprovalWidget } from '@/lib/workflows/WorkflowApprovalWidget'
import type { ColumnDef } from '@tanstack/react-table'

type PageState = 'loading' | 'notFound' | 'ready'
type BomLine = {
  id: string; line_number: number; component_code: string; component_name: string
  component_type: string; quantity: string; uom: string; scrap_pct: string
  is_critical: boolean; is_phantom: boolean; lead_offset_days: number; notes: string | null
}

const STATUS_VARIANT: Record<string, 'neutral' | 'warning' | 'success' | 'error'> = {
  draft: 'neutral', active: 'success', superseded: 'warning', archived: 'error',
}
const STATUS_LABEL: Record<string, string> = {
  draft: 'Borrador', active: 'Activo', superseded: 'Reemplazado', archived: 'Archivado',
}
const COMP_TYPE_LABEL: Record<string, string> = {
  raw_material: 'MP', packaging: 'Empaque', subassembly: 'Subconjunto', consumable: 'Consumible',
}
const COMP_TYPE_VARIANT: Record<string, 'neutral' | 'info' | 'warning' | 'success'> = {
  raw_material: 'neutral', packaging: 'info', subassembly: 'warning', consumable: 'neutral',
}

export default function BomDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { runMutation } = useGuardedMutation({ contextId: 'mfg_bom.page' })

  const [state, setState]         = React.useState<PageState>('loading')
  const [bom, setBom]             = React.useState<any>(null)
  const [lines, setLines]         = React.useState<BomLine[]>([])
  const [showAddLine, setAddLine] = React.useState(false)
  const [showExplode, setExplode] = React.useState(false)
  const [explodeData, setExplodeData] = React.useState<any>(null)
  const [loadingExplode, setLoadExplode] = React.useState(false)

  const load = React.useCallback(async () => {
    setState('loading')
    const [bomRes, linesRes] = await Promise.all([
      apiCall<{ items: any[] }>(`/api/mfg-bom/bom-headers?id=${params.id}`),
      apiCall<{ items: BomLine[] }>(`/api/mfg-bom/bom-lines?bom_id=${params.id}&pageSize=500`, undefined, { fallback: { items: [] } }),
    ])
    const b = (bomRes.result?.items ?? [])[0] ?? null
    if (!b) { setState('notFound'); return }
    setBom(b)
    setLines(((linesRes.result?.items ?? []) as BomLine[]).sort((a, b) => a.line_number - b.line_number))
    setState('ready')
  }, [params.id])

  React.useEffect(() => { load() }, [load])

  const loadExplosion = async () => {
    setLoadExplode(true)
    const res = await apiCall<any>(`/api/mfg-bom/bom-explode?bom_id=${params.id}&levels=3`, undefined, { fallback: null })
    if (res.ok && res.result) setExplodeData(res.result.bom)
    setLoadExplode(false)
    setExplode(true)
  }

  const handleDeleteLine = (line: BomLine) => {
    runMutation({
      context: { entityId: 'mfg_bom.line', recordId: line.id },
      operation: async () => {
        await apiCallOrThrow('/api/mfg-bom/bom-lines', {
          method: 'DELETE',
          body: JSON.stringify({ id: line.id }),
        })
        flash('Componente eliminado', 'success')
        load()
      },
    })
  }

  // Calculate total quantity with scrap per component
  const totalMpKg = lines
    .filter((l) => l.component_type === 'raw_material')
    .reduce((s, l) => s + Number(l.quantity) * (1 + Number(l.scrap_pct) / 100), 0)

  const lineColumns: ColumnDef<BomLine>[] = [
    { accessorKey: 'line_number', header: '#', cell: ({ row }) => <span className="text-muted-foreground text-xs">{row.original.line_number}</span> },
    {
      accessorKey: 'component_code',
      header: 'Componente',
      cell: ({ row }) => (
        <div>
          <span className="font-mono text-sm font-semibold">{row.original.component_code}</span>
          <div className="text-xs text-muted-foreground">{row.original.component_name}</div>
        </div>
      ),
    },
    {
      accessorKey: 'component_type',
      header: 'Tipo',
      cell: ({ row }) => (
        <StatusBadge variant={COMP_TYPE_VARIANT[row.original.component_type] ?? 'neutral'}>
          {COMP_TYPE_LABEL[row.original.component_type] ?? row.original.component_type}
        </StatusBadge>
      ),
    },
    {
      id: 'quantity_detail',
      header: 'Cantidad (+ merma)',
      cell: ({ row }) => {
        const l = row.original
        const withScrap = Number(l.quantity) * (1 + Number(l.scrap_pct) / 100)
        return (
          <div>
            <span className="font-semibold">{l.quantity} {l.uom}</span>
            {Number(l.scrap_pct) > 0 && (
              <div className="text-xs text-muted-foreground">→ pedir {withScrap.toFixed(4)} {l.uom} ({l.scrap_pct}% merma)</div>
            )}
          </div>
        )
      },
    },
    {
      id: 'flags',
      header: 'Flags',
      cell: ({ row }) => (
        <div className="flex gap-1 flex-wrap">
          {row.original.is_critical && <StatusBadge variant="error">Crítico</StatusBadge>}
          {row.original.is_phantom && <StatusBadge variant="neutral">Fantasma</StatusBadge>}
          {row.original.lead_offset_days > 0 && (
            <span className="text-xs text-muted-foreground">{row.original.lead_offset_days}d ant.</span>
          )}
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => bom?.status === 'draft' ? (
        <RowActions items={[
          { id: 'delete', label: 'Eliminar componente'as const, onSelect: () => handleDeleteLine(row.original) },
        ]} />
      ) : null,
    },
  ]

  if (state === 'loading') return <Page><PageBody><LoadingMessage label="Cargando BOM..." /></PageBody></Page>
  if (state === 'notFound') return (
    <Page><PageBody>
      <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/mfg-bom')} className="mb-4">
        <ArrowLeft className="mr-2 size-4" /> BOMs
      </Button>
      <ErrorMessage label="BOM no encontrado." />
    </PageBody></Page>
  )

  const isEditable = bom.status === 'draft'

  return (
    <Page>
      <PageHeader
        title={`${bom.product_code} — v${bom.version}`}
        description={`${bom.product_name} · ${bom.bom_type === 'process' ? 'Por procesos' : 'Discreto'} · Base: ${bom.base_quantity} ${bom.base_uom}${bom.expected_yield_pct ? ` · Rendimiento: ${bom.expected_yield_pct}%` : ''}`}
        actions={
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/mfg-bom')}>
              <ArrowLeft className="mr-2 size-4" /> BOMs
            </Button>
            <StatusBadge variant={STATUS_VARIANT[bom.status] ?? 'neutral'} dot>
              {STATUS_LABEL[bom.status] ?? bom.status}
            </StatusBadge>
            {bom.bom_type === 'discrete' && (
              <Button type="button" variant="outline" size="sm" onClick={loadingExplode ? undefined : loadExplosion} disabled={loadingExplode}>
                <GitBranch className="size-4 mr-2" /> {loadingExplode ? 'Cargando...' : 'Ver árbol'}
              </Button>
            )}
            {isEditable && (
              <Button type="button" onClick={() => setAddLine(!showAddLine)}>
                <Plus className="size-4 mr-2" /> Agregar componente
              </Button>
            )}
          </div>
        }
      />
      <PageBody>
        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-1">Componentes</div>
            <div className="text-2xl font-bold">{lines.length}</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-1">MP total c/ merma</div>
            <div className="text-2xl font-bold">{totalMpKg.toFixed(3)} {bom.base_uom}</div>
          </div>
          {bom.expected_yield_pct && (
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="text-xs text-muted-foreground mb-1">Rendimiento esperado</div>
              <div className="text-2xl font-bold text-primary">{bom.expected_yield_pct}%</div>
            </div>
          )}
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-1">Producción base</div>
            <div className="text-2xl font-bold">{bom.base_quantity} {bom.base_uom}</div>
          </div>
        </div>

        {/* Add component form */}
        {showAddLine && isEditable && (
          <div className="mb-6 border border-border rounded-lg p-4 bg-background">
            <h3 className="text-sm font-semibold mb-4">Agregar Componente al BOM</h3>
            <CrudForm{...({} as any)}
              entityId="mfg_bom.line"
              apiPath="/api/mfg-bom/bom-lines"
              mode="create"
              initial={{ bom_id: params.id, line_number: lines.length + 1 }}
              fields={[
                { type: 'text' as const,   id: 'component_code',   label: 'Código del Componente', required: true },
                { type: 'text' as const,   id: 'component_name',   label: 'Nombre del Componente', required: true },
                { type: 'select' as const, id: 'component_type',   label: 'Tipo de Componente', required: true,
                  options: [
                    { value: 'raw_material', label: 'Materia Prima' },
                    { value: 'packaging',    label: 'Material de Empaque' },
                    { value: 'subassembly',  label: 'Subconjunto (tiene su propio BOM)' },
                    { value: 'consumable',   label: 'Consumible de proceso' },
                  ]},
                { type: 'text' as const,   id: 'quantity',         label: 'Cantidad por base del BOM', required: true },
                { type: 'text' as const,   id: 'uom',              label: 'Unidad de Medida', required: true },
                { type: 'text' as const,   id: 'scrap_pct',        label: 'Merma del proceso (%)' },
                { type: 'number' as const, id: 'lead_offset_days', label: 'Días de anticipación para solicitar' },
                { type: 'textarea' as const, id: 'notes',          label: 'Notas / Especificaciones' },
              ]}
              groups={[
                { id: 'component', title: 'Componente',   fields: ['component_code', 'component_name', 'component_type'] },
                { id: 'quantity',  title: 'Cantidad',     fields: ['quantity', 'uom', 'scrap_pct', 'lead_offset_days'] },
                { id: 'notes',     title: 'Notas',        fields: ['notes'] },
              ]}
              onSubmit={async (values) => {
                await apiCallOrThrow('/api/mfg-bom/bom-lines', {
                  method: 'POST',
                  body: JSON.stringify({ ...values, bom_id: params.id }),
                })
                flash('Componente agregado', 'success')
                setAddLine(false)
                load()
              }}
            />
          </div>
        )}

        {/* BOM explosion tree (discrete only) */}
        {showExplode && explodeData && (
          <div className="mb-6 border border-primary/30 rounded-xl p-4 bg-muted/20">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <GitBranch className="size-4 text-primary" /> Árbol de Componentes (explosión multinivel)
              </h3>
              <Button type="button" size="sm" variant="ghost" onClick={() => setExplode(false)}>Cerrar</Button>
            </div>
            <BomTree node={explodeData} indent={0} />
          </div>
        )}

        {/* Components table */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-3">Componentes ({lines.length})</h3>
          <DataTable
            entityId="mfg_bom.line"
            data={lines}
            columns={lineColumns}
            isLoading={false}
            emptyState="Sin componentes"
            stickyActionsColumn
          />
        </div>

        {/* Workflow ApprovalWidget for BOM approval */}
        {(bom.status === 'draft' || bom.status === 'active') && (
          <WorkflowApprovalWidget
            workflowId="bom_approval_v1"
            entityId={params.id}
            entityType="MfgBomHeader"
            title="Aprobación de BOM"
            startLabel="Solicitar aprobación de ingeniería"
            startContext={{
              bom_id:       params.id,
              product_code: bom.product_code,
              product_name: bom.product_name,
              version:      bom.version,
              components:   lines.length,
            }}
            decisions={[
              { value: 'approve',              label: 'Aprobado — activar versión',             variant: 'default' },
              { value: 'approve_conditional',  label: 'Aprobado con condiciones documentadas', variant: 'outline' },
              { value: 'reject',               label: 'Rechazado — requiere correcciones',      variant: 'destructive' },
            ]}
            onCompleted={() => load()}
          />
        )}
      </PageBody>
    </Page>
  )
}

// ─── BOM explosion tree component ─────────────────────────────────────────────

function BomTree({ node, indent }: { node: any; indent: number }) {
  if (!node) return null
  return (
    <div style={{ marginLeft: indent * 20 }}>
      {indent > 0 && (
        <div className="text-xs text-muted-foreground mb-1 mt-2">
          └─ {node.product_code} — {node.product_name} (×{node.base_quantity} {node.base_uom})
        </div>
      )}
      {(node.lines ?? []).map((line: any) => (
        <div key={line.id}>
          <div className={`flex items-center gap-2 py-1 text-sm ${line.is_critical ? 'font-medium' : ''}`}
               style={{ paddingLeft: (indent + 1) * 20 }}>
            <span className="text-muted-foreground">{'└─'}</span>
            <span className="font-mono text-xs text-muted-foreground w-24 shrink-0">{line.component_code}</span>
            <span>{line.component_name}</span>
            <span className="text-muted-foreground ml-2">{line.quantity_with_scrap} {line.uom}</span>
            {line.is_critical && <StatusBadge variant="error">Crítico</StatusBadge>}
            {(line.alternatives ?? []).length > 0 && (
              <span className="text-xs text-muted-foreground">{line.alternatives.length} alt.</span>
            )}
          </div>
          {line.sub_bom && <BomTree node={line.sub_bom} indent={indent + 1} />}
        </div>
      ))}
    </div>
  )
}
