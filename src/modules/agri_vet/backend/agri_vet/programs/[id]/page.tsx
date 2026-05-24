'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Page, PageBody, PageHeader } from '@open-mercato/ui/backend/Page'
import { apiCall, apiCallOrThrow } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@open-mercato/ui/primitives/button'
import { Input } from '@open-mercato/ui/primitives/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@open-mercato/ui/primitives/select'
import { StatusBadge } from '@open-mercato/ui/primitives/status-badge'
import { LoadingMessage, ErrorMessage } from '@open-mercato/ui/backend/detail'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { ArrowLeft, Plus, Trash2, Save, Syringe } from 'lucide-react'

type PageState = 'loading' | 'notFound' | 'ready'

type VacEntry = {
  vaccine_name: string
  active_ingredient: string
  manufacturer: string
  route: string
  age_days: string
  dose_per_bird: string
  dose_unit: string
  withdrawal_days: string
  notes: string
}

const ROUTE_OPTIONS = [
  { value: 'drinking_water', label: 'Agua de bebida' },
  { value: 'ocular',        label: 'Ocular (gota)' },
  { value: 'injectable',    label: 'Inyectable' },
  { value: 'spray',         label: 'Spray' },
  { value: 'subcutaneous',  label: 'Subcutáneo' },
  { value: 'oral',          label: 'Oral' },
]
const UNIT_OPTIONS = [
  { value: 'doses', label: 'Dosis' },
  { value: 'ml',    label: 'Mililitros (ml)' },
  { value: 'mg',    label: 'Miligramos (mg)' },
]

const SPECIES_LABEL: Record<string, string> = {
  broiler: 'Pollo de Engorde', layer: 'Ponedora', turkey: 'Pavo',
  swine: 'Cerdo', bovine: 'Bovino', all: 'General',
}

function emptyEntry(): VacEntry {
  return {
    vaccine_name: '', active_ingredient: '', manufacturer: '',
    route: 'drinking_water', age_days: '', dose_per_bird: '1',
    dose_unit: 'doses', withdrawal_days: '0', notes: '',
  }
}

export default function VaccinationProgramDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()

  const [state, setState]     = React.useState<PageState>('loading')
  const [program, setProgram] = React.useState<any>(null)
  const [entries, setEntries] = React.useState<VacEntry[]>([])
  const [saving, setSaving]   = React.useState(false)
  const [hasChanges, setHasChanges] = React.useState(false)

  const load = React.useCallback(async () => {
    setState('loading')
    const res = await apiCall<{ items: any[] }>(`/api/agri-vet/vaccination-programs?id=${params.id}`)
    const p = (res.result?.items ?? [])[0] ?? null
    if (!p) { setState('notFound'); return }
    setProgram(p)
    const vax = (p.vaccinations ?? []) as any[]
    setEntries(vax.map((v: any) => ({
      vaccine_name:      v.vaccine_name ?? '',
      active_ingredient: v.active_ingredient ?? '',
      manufacturer:      v.manufacturer ?? '',
      route:             v.route ?? 'drinking_water',
      age_days:          v.age_days != null ? String(v.age_days) : '',
      dose_per_bird:     v.dose_per_bird != null ? String(v.dose_per_bird) : '1',
      dose_unit:         v.dose_unit ?? 'doses',
      withdrawal_days:   v.withdrawal_days != null ? String(v.withdrawal_days) : '0',
      notes:             v.notes ?? '',
    })))
    setState('ready')
    setHasChanges(false)
  }, [params.id])

  React.useEffect(() => { load() }, [load])

  const update = (idx: number, field: keyof VacEntry, value: string) => {
    setEntries((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], [field]: value }
      return next
    })
    setHasChanges(true)
  }

  const addEntry = () => { setEntries((prev) => [...prev, emptyEntry()]); setHasChanges(true) }
  const removeEntry = (idx: number) => { setEntries((prev) => prev.filter((_, i) => i !== idx)); setHasChanges(true) }

  const save = async () => {
    setSaving(true)
    try {
      const payload = entries.map((e) => ({
        vaccine_name:      e.vaccine_name,
        active_ingredient: e.active_ingredient || undefined,
        manufacturer:      e.manufacturer || undefined,
        route:             e.route,
        age_days:          e.age_days !== '' ? Number(e.age_days) : 0,
        dose_per_bird:     e.dose_per_bird !== '' ? Number(e.dose_per_bird) : undefined,
        dose_unit:         e.dose_unit,
        withdrawal_days:   e.withdrawal_days !== '' ? Number(e.withdrawal_days) : 0,
        notes:             e.notes || undefined,
      }))
      await apiCallOrThrow('/api/agri-vet/vaccination-programs', {
        method: 'PUT',
        body: JSON.stringify({ id: params.id, vaccinations: payload }),
      })
      flash('Programa guardado', 'success')
      setHasChanges(false)
    } catch {
      flash('Error al guardar — intenta de nuevo', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (state === 'loading') return <Page><PageBody><LoadingMessage label="Cargando programa..." /></PageBody></Page>
  if (state === 'notFound') return (
    <Page><PageBody>
      <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/agri-vet/programs')} className="mb-4">
        <ArrowLeft className="mr-2 size-4" /> Programas
      </Button>
      <ErrorMessage label="Programa no encontrado." />
    </PageBody></Page>
  )

  // Sort entries by age_days for display
  const sorted = [...entries].sort((a, b) => Number(a.age_days || 0) - Number(b.age_days || 0))

  return (
    <Page>
      <PageHeader
        title={program.name}
        description={`${SPECIES_LABEL[program.species] ?? program.species} · ${entries.length} vacuna${entries.length !== 1 ? 's' : ''} en el programa`}
        actions={
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/agri-vet/programs')}>
              <ArrowLeft className="mr-2 size-4" /> Programas
            </Button>
            <StatusBadge variant={program.is_active ? 'success' : 'neutral'} dot>
              {program.is_active ? 'Activo' : 'Inactivo'}
            </StatusBadge>
            {hasChanges && (
              <Button type="button" onClick={save} disabled={saving}>
                <Save className="size-4 mr-2" /> {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            )}
          </div>
        }
      />
      <PageBody>
        {/* Cómo usar este programa */}
        <div className="mb-4 p-3 bg-muted/30 rounded-lg text-xs text-muted-foreground">
          <strong>Cómo funciona:</strong> Cuando inicies un flock y asignes este programa, el sistema generará automáticamente un registro de vacunación programado para cada entrada de esta lista. La fecha de cada vacuna = fecha de entrada de los pollitos + días de edad indicados.
        </div>

        {/* Timeline visual */}
        {sorted.filter((e) => e.age_days !== '').length > 0 && (
          <div className="mb-6 p-4 bg-muted/20 rounded-lg">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Línea de tiempo</h3>
            <div className="flex flex-wrap gap-2">
              {sorted
                .filter((e) => e.vaccine_name && e.age_days !== '')
                .map((e, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-background border border-border rounded-md px-3 py-1.5 text-xs">
                    <Syringe className="size-3 text-primary" />
                    <span className="font-semibold">Día {e.age_days}</span>
                    <span className="text-muted-foreground">·</span>
                    <span>{e.vaccine_name}</span>
                    {Number(e.withdrawal_days) > 0 && (
                      <span className="text-status-warning-text ml-1">retiro {e.withdrawal_days}d</span>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Editor */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Calendario de Vacunaciones</h3>
          <Button type="button" size="sm" onClick={addEntry}>
            <Plus className="size-4 mr-2" /> Agregar Vacuna
          </Button>
        </div>

        <div className="space-y-4">
          {entries.map((e, idx) => (
            <div key={idx} className="border border-border rounded-lg p-4 bg-card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-muted-foreground">
                  Vacuna #{idx + 1}{e.age_days ? ` — Día ${e.age_days}` : ''}
                </span>
                <Button type="button" size="sm" variant="destructive-ghost" onClick={() => removeEntry(idx)} aria-label="Eliminar vacuna">
                  <Trash2 className="size-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Nombre */}
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Nombre comercial de la vacuna *</label>
                  <Input value={e.vaccine_name} onChange={(ev: React.ChangeEvent<HTMLInputElement>) => update(idx, 'vaccine_name', ev.target.value)} placeholder="Newcastle B1, Gumboro Bursine 2..." />
                </div>

                {/* Día de aplicación */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Día de edad de aplicación *</label>
                  <Input type="number" min="0" value={e.age_days} onChange={(ev: React.ChangeEvent<HTMLInputElement>) => update(idx, 'age_days', ev.target.value)} placeholder="7" />
                </div>

                {/* Principio activo */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Principio activo</label>
                  <Input value={e.active_ingredient} onChange={(ev: React.ChangeEvent<HTMLInputElement>) => update(idx, 'active_ingredient', ev.target.value)} placeholder="Newcastle virus cepa B1..." />
                </div>

                {/* Fabricante */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Laboratorio fabricante</label>
                  <Input value={e.manufacturer} onChange={(ev: React.ChangeEvent<HTMLInputElement>) => update(idx, 'manufacturer', ev.target.value)} placeholder="Merial, Intervet, Boehringer..." />
                </div>

                {/* Vía */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Vía de administración</label>
                  <Select value={e.route} onValueChange={(v) => update(idx, 'route', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ROUTE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Dosis */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Dosis por ave</label>
                  <Input type="number" min="0" step="any" value={e.dose_per_bird} onChange={(ev: React.ChangeEvent<HTMLInputElement>) => update(idx, 'dose_per_bird', ev.target.value)} placeholder="1" />
                </div>

                {/* Unidad dosis */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Unidad de dosis</label>
                  <Select value={e.dose_unit} onValueChange={(v) => update(idx, 'dose_unit', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {UNIT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Retiro */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Días de retiro antes del beneficio</label>
                  <Input type="number" min="0" value={e.withdrawal_days} onChange={(ev: React.ChangeEvent<HTMLInputElement>) => update(idx, 'withdrawal_days', ev.target.value)} placeholder="0" />
                </div>

                {/* Notas — full width */}
                <div className="md:col-span-3">
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Instrucciones de preparación / notas</label>
                  <Input value={e.notes} onChange={(ev: React.ChangeEvent<HTMLInputElement>) => update(idx, 'notes', ev.target.value)} placeholder="Diluir en agua sin cloro. No mezclar con desinfectantes." />
                </div>
              </div>
            </div>
          ))}

          {entries.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground border border-dashed border-border rounded-lg">
              Sin vacunas definidas. Haz clic en "Agregar Vacuna" para construir el calendario.
            </div>
          )}
        </div>

        {hasChanges && (
          <div className="mt-6 flex justify-end">
            <Button type="button" onClick={save} disabled={saving}>
              <Save className="size-4 mr-2" /> {saving ? 'Guardando...' : 'Guardar programa'}
            </Button>
          </div>
        )}
      </PageBody>
    </Page>
  )
}
