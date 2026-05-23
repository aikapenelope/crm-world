'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Page, PageBody, PageHeader } from '@open-mercato/ui/backend/Page'
import { apiCall, apiCallOrThrow } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@open-mercato/ui/primitives/button'
import { Input } from '@open-mercato/ui/primitives/input'
import { StatusBadge } from '@open-mercato/ui/primitives/status-badge'
import { LoadingMessage, ErrorMessage } from '@open-mercato/ui/backend/detail'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react'

type PageState = 'loading' | 'notFound' | 'ready'

type CcpEntry = {
  id: string
  name: string
  parameter: string
  limit_min: string
  limit_max: string
  unit: string
  monitoring_freq: string
  monitoring_method: string
  corrective_action: string
}

function emptyRow(): CcpEntry {
  return {
    id: `CCP-${Date.now()}`,
    name: '',
    parameter: 'temperature',
    limit_min: '',
    limit_max: '',
    unit: '°C',
    monitoring_freq: 'cada 15 min',
    monitoring_method: 'termómetro calibrado',
    corrective_action: '',
  }
}

const STATUS_LABEL: Record<string, string> = { draft: 'Borrador', active: 'Activo', superseded: 'Reemplazado' }
const STATUS_VARIANT: Record<string, 'neutral' | 'success' | 'error'> = {
  draft: 'neutral', active: 'success', superseded: 'error',
}

export default function HaccpPlanDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()

  const [state, setState]     = React.useState<PageState>('loading')
  const [plan, setPlan]       = React.useState<any>(null)
  const [ccps, setCcps]       = React.useState<CcpEntry[]>([])
  const [saving, setSaving]   = React.useState(false)
  const [hasChanges, setHasChanges] = React.useState(false)

  const load = React.useCallback(async () => {
    setState('loading')
    const res = await apiCall<{ items: any[] }>(`/api/agri-quality/haccp-plans?id=${params.id}`)
    const p = (res.result?.items ?? [])[0] ?? null
    if (!p) { setState('notFound'); return }
    setPlan(p)
    setCcps((p.critical_control_points ?? []).map((c: any) => ({
      id:                c.id ?? `CCP-${Math.random().toString(36).slice(2, 7)}`,
      name:              c.name ?? '',
      parameter:         c.parameter ?? 'temperature',
      limit_min:         c.limit_min != null ? String(c.limit_min) : '',
      limit_max:         c.limit_max != null ? String(c.limit_max) : '',
      unit:              c.unit ?? '°C',
      monitoring_freq:   c.monitoring_freq ?? '',
      monitoring_method: c.monitoring_method ?? '',
      corrective_action: c.corrective_action ?? '',
    })))
    setState('ready')
    setHasChanges(false)
  }, [params.id])

  React.useEffect(() => { load() }, [load])

  const updateRow = (idx: number, field: keyof CcpEntry, value: string) => {
    setCcps((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], [field]: value }
      return next
    })
    setHasChanges(true)
  }

  const addRow = () => {
    setCcps((prev) => [...prev, emptyRow()])
    setHasChanges(true)
  }

  const removeRow = (idx: number) => {
    setCcps((prev) => prev.filter((_, i) => i !== idx))
    setHasChanges(true)
  }

  const save = async () => {
    setSaving(true)
    try {
      // Serialize back to the JSON format the entity expects
      const payload = ccps.map((c) => ({
        id:                c.id,
        name:              c.name,
        parameter:         c.parameter,
        limit_min:         c.limit_min !== '' ? Number(c.limit_min) : null,
        limit_max:         c.limit_max !== '' ? Number(c.limit_max) : null,
        unit:              c.unit,
        monitoring_freq:   c.monitoring_freq,
        monitoring_method: c.monitoring_method,
        corrective_action: c.corrective_action,
      }))
      await apiCallOrThrow('/api/agri-quality/haccp-plans', {
        method: 'PUT',
        body: JSON.stringify({ id: params.id, critical_control_points: payload }),
      })
      flash('PCCs guardados', 'success')
      setHasChanges(false)
    } catch {
      flash('Error al guardar — intenta de nuevo', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (state === 'loading') return <Page><PageBody><LoadingMessage label="Cargando plan HACCP..." /></PageBody></Page>
  if (state === 'notFound') return (
    <Page><PageBody>
      <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/agri-quality/haccp')} className="mb-4">
        <ArrowLeft className="mr-2 size-4" /> Planes HACCP
      </Button>
      <ErrorMessage message="Plan no encontrado." />
    </PageBody></Page>
  )

  return (
    <Page>
      <PageHeader
        title={plan.name}
        description={`${plan.process} · v${plan.version} · ${ccps.length} PCCs definidos`}
        actions={
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/agri-quality/haccp')}>
              <ArrowLeft className="mr-2 size-4" /> Planes
            </Button>
            <StatusBadge variant={STATUS_VARIANT[plan.status] ?? 'neutral'} dot>
              {STATUS_LABEL[plan.status] ?? plan.status}
            </StatusBadge>
            {hasChanges && (
              <Button type="button" onClick={save} disabled={saving}>
                <Save className="size-4 mr-2" /> {saving ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            )}
          </div>
        }
      />
      <PageBody>
        {/* Info alert for empty plans */}
        {ccps.length === 0 && (
          <div className="mb-4 p-3 bg-status-warning-bg border border-status-warning-border rounded-lg text-sm text-status-warning-text">
            Este plan aún no tiene PCCs definidos. Agrega al menos un Punto Crítico de Control antes de activar el plan.
          </div>
        )}

        {/* PCCs editor */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Puntos Críticos de Control (PCCs)</h3>
          <Button type="button" size="sm" onClick={addRow}>
            <Plus className="size-4 mr-2" /> Agregar PCC
          </Button>
        </div>

        <div className="space-y-4">
          {ccps.map((ccp, idx) => (
            <div key={ccp.id} className="border border-border rounded-lg p-4 bg-card">
              {/* PCC header row */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold bg-primary text-primary-foreground rounded px-2 py-0.5">
                    {ccp.id}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">Punto Crítico de Control</span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive-ghost"
                  onClick={() => removeRow(idx)}
                  aria-label={`Eliminar ${ccp.id}`}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>

              {/* Fields grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* ID + Nombre */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">ID del PCC</label>
                  <Input
                    value={ccp.id}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateRow(idx, 'id', e.target.value)}
                    placeholder="CCP-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Nombre del PCC *</label>
                  <Input
                    value={ccp.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateRow(idx, 'name', e.target.value)}
                    placeholder="Temperatura de escaldado"
                  />
                </div>

                {/* Parámetro + Unidad */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Parámetro medido</label>
                  <Input
                    value={ccp.parameter}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateRow(idx, 'parameter', e.target.value)}
                    placeholder="temperature, pH, chlorine..."
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Unidad</label>
                  <Input
                    value={ccp.unit}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateRow(idx, 'unit', e.target.value)}
                    placeholder="°C, pH, ppm, %..."
                  />
                </div>

                {/* Límites */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Límite mínimo (dejar vacío si no aplica)</label>
                  <Input
                    type="number"
                    step="any"
                    value={ccp.limit_min}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateRow(idx, 'limit_min', e.target.value)}
                    placeholder="ej: 0"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Límite máximo (dejar vacío si no aplica)</label>
                  <Input
                    type="number"
                    step="any"
                    value={ccp.limit_max}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateRow(idx, 'limit_max', e.target.value)}
                    placeholder="ej: 62"
                  />
                </div>

                {/* Monitoreo */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Frecuencia de monitoreo</label>
                  <Input
                    value={ccp.monitoring_freq}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateRow(idx, 'monitoring_freq', e.target.value)}
                    placeholder="cada 15 min, cada hora, continuo..."
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Método de monitoreo</label>
                  <Input
                    value={ccp.monitoring_method}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateRow(idx, 'monitoring_method', e.target.value)}
                    placeholder="termómetro calibrado, pH-metro..."
                  />
                </div>

                {/* Acción correctiva — full width */}
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Acción correctiva cuando se supera el límite *</label>
                  <Input
                    value={ccp.corrective_action}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateRow(idx, 'corrective_action', e.target.value)}
                    placeholder="Ajustar temperatura y retener el lote hasta nueva medición confirmada dentro de rango..."
                  />
                </div>
              </div>

              {/* Limit summary */}
              {(ccp.limit_min !== '' || ccp.limit_max !== '') && (
                <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                  Rango aceptable:{' '}
                  {ccp.limit_min !== '' ? `≥ ${ccp.limit_min} ${ccp.unit}` : ''}
                  {ccp.limit_min !== '' && ccp.limit_max !== '' ? ' y ' : ''}
                  {ccp.limit_max !== '' ? `≤ ${ccp.limit_max} ${ccp.unit}` : ''}
                  {' '}— fuera de este rango se genera una No-Conformidad automáticamente.
                </div>
              )}
            </div>
          ))}

          {ccps.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground border border-dashed border-border rounded-lg">
              Sin PCCs definidos. Haz clic en "Agregar PCC" para comenzar.
            </div>
          )}
        </div>

        {/* Save button at bottom */}
        {hasChanges && (
          <div className="mt-6 flex justify-end">
            <Button type="button" onClick={save} disabled={saving}>
              <Save className="size-4 mr-2" /> {saving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        )}
      </PageBody>
    </Page>
  )
}
