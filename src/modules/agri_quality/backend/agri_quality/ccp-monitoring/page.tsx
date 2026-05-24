'use client'

import * as React from 'react'
import { Page, PageBody, PageHeader } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall, apiCallOrThrow } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@open-mercato/ui/primitives/button'
import { Input } from '@open-mercato/ui/primitives/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@open-mercato/ui/primitives/select'
import { StatusBadge } from '@open-mercato/ui/primitives/status-badge'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { ClipboardCheck, AlertOctagon } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

type HaccpPlan = { id: string; name: string; process: string; critical_control_points: any[] }
type LotOption = { value: string; label: string }
type RecordRow = {
  id: string
  ccp_id: string
  ccp_name: string
  monitoring_date: string
  monitoring_time: string | null
  measured_value: string
  unit: string
  limit_min: string | null
  limit_max: string | null
  is_deviation: boolean
  non_conformity_id: string | null
}

export default function CcpMonitoringPage() {
  const [plans, setPlans]           = React.useState<HaccpPlan[]>([])
  const [lotOptions, setLotOptions] = React.useState<LotOption[]>([])
  const [records, setRecords]       = React.useState<RecordRow[]>([])
  const [isLoading, setLoading]     = React.useState(true)

  // Form state
  const [selectedPlan, setSelectedPlan] = React.useState<HaccpPlan | null>(null)
  const [selectedCcp, setSelectedCcp]   = React.useState<any | null>(null)
  const [selectedLot, setSelectedLot]   = React.useState('')
  const [measuredValue, setMeasuredValue] = React.useState('')
  const [monitoringTime, setTime]       = React.useState(() => {
    const now = new Date()
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  })
  const [submitting, setSubmitting]     = React.useState(false)

  const load = React.useCallback(async () => {
    setLoading(true)
    const [planRes, lotRes, recRes] = await Promise.all([
      apiCall<{ items: HaccpPlan[] }>('/api/agri-quality/haccp-plans?status=active&pageSize=10', undefined, { fallback: { items: [] } }),
      apiCall<{ items: any[] }>('/api/agri-processing/processing-lots?status=in_stock&pageSize=100', undefined, { fallback: { items: [] } }),
      apiCall<{ items: RecordRow[] }>('/api/agri-quality/ccp-monitoring?pageSize=100', undefined, { fallback: { items: [] } }),
    ])
    const fetchedPlans = planRes.result?.items ?? []
    setPlans(fetchedPlans)
    if (fetchedPlans.length > 0 && !selectedPlan) setSelectedPlan(fetchedPlans[0])
    setLotOptions((lotRes.result?.items ?? []).map((l: any) => ({ value: l.id, label: `${l.lot_number} (${l.quantity_kg} kg)` })))
    setRecords(recRes.result?.items ?? [])
    setLoading(false)
  }, [selectedPlan])

  React.useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-compute deviation when value or CCP changes
  const isDeviation = React.useMemo(() => {
    if (!selectedCcp || measuredValue === '') return false
    const val = Number(measuredValue)
    if (isNaN(val)) return false
    if (selectedCcp.limit_min != null && val < Number(selectedCcp.limit_min)) return true
    if (selectedCcp.limit_max != null && val > Number(selectedCcp.limit_max)) return true
    return false
  }, [selectedCcp, measuredValue])

  const handleSubmit = async () => {
    if (!selectedPlan || !selectedCcp || measuredValue === '') {
      flash('Selecciona el plan, el PCC y el valor medido', 'warning')
      return
    }
    setSubmitting(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      await apiCallOrThrow('/api/agri-quality/ccp-monitoring', {
        method: 'POST',
        body: JSON.stringify({
          haccp_plan_id:    selectedPlan.id,
          ccp_id:           selectedCcp.id,
          ccp_name:         selectedCcp.name,
          monitoring_date:  today,
          monitoring_time:  monitoringTime,
          measured_value:   measuredValue,
          unit:             selectedCcp.unit ?? '°C',
          limit_min:        selectedCcp.limit_min != null ? String(selectedCcp.limit_min) : null,
          limit_max:        selectedCcp.limit_max != null ? String(selectedCcp.limit_max) : null,
          is_deviation:     isDeviation,
          processing_lot_id: selectedLot || null,
        }),
      })
      if (isDeviation) {
        flash(`⚠ Desviación registrada — No-Conformidad creada automáticamente para ${selectedCcp.id}`, 'error')
      } else {
        flash(`✓ ${selectedCcp.id} en rango — ${measuredValue} ${selectedCcp.unit ?? ''}`, 'success')
      }
      setMeasuredValue('')
      load()
    } catch {
      flash('Error al registrar — intenta de nuevo', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const todayRecords = records.filter((r) => r.monitoring_date === new Date().toISOString().split('T')[0])
  const todayDeviations = todayRecords.filter((r) => r.is_deviation).length

  const columns: ColumnDef<RecordRow>[] = [
    {
      accessorKey: 'monitoring_time',
      header: 'Hora',
      cell: ({ row }) => (row.original as RecordRow).monitoring_time ?? new Date((row.original as RecordRow).monitoring_date).toLocaleDateString('es-VE'),
    },
    {
      accessorKey: 'ccp_id',
      header: 'PCC',
      cell: ({ row }) => (
        <div>
          <span className="font-mono font-semibold text-sm">{(row.original as RecordRow).ccp_id}</span>
          <div className="text-xs text-muted-foreground">{(row.original as RecordRow).ccp_name}</div>
        </div>
      ),
    },
    {
      accessorKey: 'measured_value',
      header: 'Valor',
      cell: ({ row }) => {
        const r = row.original as RecordRow
        return (
          <span className={r.is_deviation ? 'font-bold text-status-error-text' : 'font-semibold text-status-success-text'}>
            {r.measured_value} {r.unit}
          </span>
        )
      },
    },
    {
      id: 'limits',
      header: 'Límites',
      cell: ({ row }) => {
        const r = row.original as RecordRow
        const parts = []
        if (r.limit_min) parts.push(`≥ ${r.limit_min}`)
        if (r.limit_max) parts.push(`≤ ${r.limit_max}`)
        return <span className="text-xs text-muted-foreground">{parts.join(' y ') || '—'} {r.unit}</span>
      },
    },
    {
      accessorKey: 'is_deviation',
      header: 'Resultado',
      cell: ({ row }) => (row.original as RecordRow).is_deviation ? (
        <StatusBadge variant="error">Desviación</StatusBadge>
      ) : (
        <StatusBadge variant="success">En rango</StatusBadge>
      ),
    },
    {
      accessorKey: 'non_conformity_id',
      header: 'NC',
      cell: ({ row }) => (row.original as RecordRow).non_conformity_id ? (
        <span className="text-xs font-mono text-status-error-text">NC creada</span>
      ) : '—',
    },
  ]

  const activePlan = plans[0] ?? null

  return (
    <Page>
      <PageHeader
        title="Monitoreo de PCCs"
        description={
          todayDeviations > 0
            ? `⚠ ${todayDeviations} desviación(es) hoy — No-Conformidades creadas`
            : `${todayRecords.length} registros hoy — sin desviaciones`
        }
      />
      <PageBody>
        {!activePlan && (
          <div className="mb-4 p-3 bg-status-warning-bg border border-status-warning-border rounded-lg text-sm text-status-warning-text">
            Sin plan HACCP activo. Activa un plan en{' '}
            <a href="/backend/agri-quality/haccp" className="underline font-medium">Planes HACCP</a>{' '}
            antes de registrar monitoreo.
          </div>
        )}

        {/* Entry form */}
        {activePlan && (
          <div className="mb-6 border border-border rounded-lg p-4 bg-background">
            <div className="flex items-center gap-2 mb-4">
              <ClipboardCheck className="size-4 text-primary" />
              <h3 className="text-sm font-semibold">Registrar Medición — {activePlan.name}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Select PCC */}
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Punto Crítico de Control *</label>
                <Select
                  value={selectedCcp?.id ?? ''}
                  onValueChange={(val) => {
                    const ccp = (activePlan.critical_control_points ?? []).find((c: any) => c.id === val) ?? null
                    setSelectedCcp(ccp)
                    setMeasuredValue('')
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Selecciona un PCC..." /></SelectTrigger>
                  <SelectContent>
                    {(activePlan.critical_control_points ?? []).map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.id} — {c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Measured value */}
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Valor medido {selectedCcp ? `(${selectedCcp.unit ?? ''})` : ''} *
                  {selectedCcp && (selectedCcp.limit_min != null || selectedCcp.limit_max != null) && (
                    <span className="ml-2 text-muted-foreground">
                      Rango:{' '}
                      {selectedCcp.limit_min != null ? `≥ ${selectedCcp.limit_min}` : ''}
                      {selectedCcp.limit_min != null && selectedCcp.limit_max != null ? ' y ' : ''}
                      {selectedCcp.limit_max != null ? `≤ ${selectedCcp.limit_max}` : ''}
                    </span>
                  )}
                </label>
                <Input
                  type="number"
                  step="any"
                  value={measuredValue}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMeasuredValue(e.target.value)}
                  placeholder={selectedCcp ? `Valor en ${selectedCcp.unit ?? ''}` : 'Selecciona un PCC primero'}
                  className={isDeviation ? 'border-status-error-border' : ''}
                />
                {isDeviation && measuredValue !== '' && (
                  <p className="text-xs text-status-error-text mt-1 flex items-center gap-1">
                    <AlertOctagon className="size-3" /> Fuera de límite — se creará una NC automáticamente
                  </p>
                )}
                {!isDeviation && measuredValue !== '' && selectedCcp && (
                  <p className="text-xs text-status-success-text mt-1">✓ Dentro del rango aceptable</p>
                )}
              </div>

              {/* Time + lot */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Hora (HH:MM)</label>
                  <Input
                    type="time"
                    value={monitoringTime}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTime(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Lote en proceso (opcional)</label>
                  <Select value={selectedLot} onValueChange={setSelectedLot}>
                    <SelectTrigger><SelectValue placeholder="Sin lote específico" /></SelectTrigger>
                    <SelectContent>
                      {lotOptions.map((l) => (
                        <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button
                type="button"
                variant={isDeviation ? 'destructive' : 'default'}
                onClick={handleSubmit}
                disabled={submitting || !selectedCcp || measuredValue === ''}
              >
                {submitting ? 'Registrando...' : isDeviation ? '⚠ Registrar desviación' : 'Registrar medición'}
              </Button>
            </div>
          </div>
        )}

        {/* Today's records */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Registros de Hoy ({todayRecords.length})</h3>
          <DataTable
            entityId="agri_quality.ccp_monitoring"
            data={todayRecords}
            columns={columns}
            isLoading={isLoading}
            emptyState="Sin registros hoy"
          />
        </div>
      </PageBody>
    </Page>
  )
}
