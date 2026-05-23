'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody, PageHeader } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { RowActions } from '@open-mercato/ui/backend/RowActions'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@open-mercato/ui/primitives/button'
import { StatusBadge } from '@open-mercato/ui/primitives/status-badge'
import { CrudForm } from '@open-mercato/ui/backend/CrudForm'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { Plus } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

type FormulaRow = {
  id: string
  name: string
  formula_type: string
  species: string
  protein_pct: string | null
  energy_kcal_kg: number | null
  cost_per_ton_usd: string
  last_cost_update: string | null
  is_active: boolean
}

const TYPE_LABEL: Record<string, string> = {
  starter: 'Iniciador', grower: 'Engorde', finisher: 'Finalizador',
  layer: 'Postura', breeding: 'Reproductores', other: 'Otro',
}

const SPECIES_LABEL: Record<string, string> = {
  broiler: 'Pollos engorde', layer: 'Ponedoras', turkey: 'Pavos',
  swine: 'Cerdos', bovine: 'Bovinos', all: 'General',
}

export default function AgriFeedPage() {
  const router = useRouter()
  const [formulas, setFormulas]  = React.useState<FormulaRow[]>([])
  const [isLoading, setLoading]  = React.useState(true)
  const [showForm, setShowForm]  = React.useState(false)
  const [editing, setEditing]    = React.useState<FormulaRow | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    const res = await apiCall<{ items: FormulaRow[] }>(
      '/api/agri-feed/formulas?pageSize=100',
      undefined,
      { fallback: { items: [] } },
    )
    if (res.ok) setFormulas(res.result?.items ?? [])
    setLoading(false)
  }, [])

  React.useEffect(() => { load() }, [load])

  const formulaFields = [
    { type: 'text' as const,   name: 'name',         label: 'Nombre de la Fórmula', required: true },
    { type: 'select' as const, name: 'formula_type', label: 'Tipo',                 required: true,
      options: [
        { value: 'starter',  label: 'Iniciador (0-14 días)' },
        { value: 'grower',   label: 'Engorde (15-35 días)' },
        { value: 'finisher', label: 'Finalizador (36+ días)' },
        { value: 'layer',    label: 'Postura' },
        { value: 'breeding', label: 'Reproductores' },
        { value: 'other',    label: 'Otro' },
      ]},
    { type: 'select' as const, name: 'species',       label: 'Especie',
      options: [
        { value: 'broiler', label: 'Pollos de Engorde' },
        { value: 'layer',   label: 'Gallinas Ponedoras' },
        { value: 'turkey',  label: 'Pavos' },
        { value: 'swine',   label: 'Cerdos' },
        { value: 'bovine',  label: 'Bovinos' },
        { value: 'all',     label: 'General' },
      ]},
    { type: 'text' as const,   name: 'protein_pct',     label: 'Proteína (%)' },
    { type: 'number' as const, name: 'energy_kcal_kg',  label: 'Energía (kcal/kg)' },
    { type: 'text' as const,   name: 'lysine_pct',      label: 'Lisina (%)' },
    { type: 'text' as const,   name: 'cost_per_ton_usd', label: 'Costo/ton (USD)' },
    { type: 'textarea' as const, name: 'notes',         label: 'Observaciones' },
  ]

  const columns: ColumnDef<FormulaRow>[] = [
    {
      accessorKey: 'name',
      header: 'Fórmula',
      cell: ({ row }) => <span className="font-semibold">{row.original.name}</span>,
    },
    {
      accessorKey: 'formula_type',
      header: 'Tipo',
      cell: ({ row }) => TYPE_LABEL[row.original.formula_type] ?? row.original.formula_type,
    },
    {
      accessorKey: 'species',
      header: 'Especie',
      cell: ({ row }) => SPECIES_LABEL[row.original.species] ?? row.original.species,
    },
    {
      accessorKey: 'protein_pct',
      header: 'Proteína',
      cell: ({ row }) => row.original.protein_pct ? `${row.original.protein_pct}%` : '—',
    },
    {
      accessorKey: 'cost_per_ton_usd',
      header: 'Costo/ton',
      cell: ({ row }) => (
        <div>
          <span className="font-semibold">USD {parseFloat(row.original.cost_per_ton_usd).toFixed(2)}</span>
          {row.original.last_cost_update && (
            <div className="text-xs text-muted-foreground">
              {new Date(row.original.last_cost_update).toLocaleDateString('es-VE')}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'is_active',
      header: 'Estado',
      cell: ({ row }) => (
        <StatusBadge variant={row.original.is_active ? 'success' : 'neutral'} dot>
          {row.original.is_active ? 'Activa' : 'Inactiva'}
        </StatusBadge>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <RowActions
          items={[
            { id: 'open',  label: 'Editar ingredientes', onSelect: () => router.push(`/backend/agri-feed/formulas/${row.original.id}`) },
            { id: 'edit',  label: 'Editar datos',        onSelect: () => { setEditing(row.original); setShowForm(true) } },
          ]}
        />
      ),
    },
  ]

  const handleSuccess = () => {
    flash(editing ? 'Fórmula actualizada' : 'Fórmula creada', 'success')
    setShowForm(false)
    setEditing(null)
    load()
  }

  const activeCount = formulas.filter(f => f.is_active).length

  return (
    <Page>
      <PageHeader
        title="Fórmulas de Alimento"
        description={`${activeCount} fórmula${activeCount !== 1 ? 's' : ''} activa${activeCount !== 1 ? 's' : ''}`}
        actions={
          <Button type="button" onClick={() => { setEditing(null); setShowForm(true) }}>
            <Plus className="size-4 mr-2" /> Nueva Fórmula
          </Button>
        }
      />
      <PageBody>
        {showForm && (
          <div className="mb-6 border border-border rounded-lg p-4 bg-background">
            <h3 className="text-sm font-semibold mb-4">
              {editing ? `Editar — ${editing.name}` : 'Nueva Fórmula'}
            </h3>
            <CrudForm
              entityId="agri_feed.formula"
              apiPath="/api/agri-feed/formulas"
              mode={editing ? 'edit' : 'create'}
              initial={editing ?? undefined}
              fields={formulaFields}
              groups={[
                { id: 'general',     label: 'General',          fields: ['name', 'formula_type', 'species'] },
                { id: 'nutrition',   label: 'Análisis Nutricional', fields: ['protein_pct', 'energy_kcal_kg', 'lysine_pct'] },
                { id: 'cost',        label: 'Costo',            fields: ['cost_per_ton_usd'] },
                { id: 'notes',       label: 'Notas',            fields: ['notes'] },
              ]}
              onSuccess={handleSuccess}
            />
          </div>
        )}

        <DataTable
          entityId="agri_feed.formula"
          extensionTableId="agri-feed-formulas-list"
          data={formulas}
          columns={columns}
          isLoading={isLoading}
          emptyState={{
            title: 'Sin fórmulas de alimento',
            description: 'Crea la primera fórmula para comenzar a gestionar el alimento balanceado.',
          }}
          stickyActionsColumn
        />
      </PageBody>
    </Page>
  )
}
