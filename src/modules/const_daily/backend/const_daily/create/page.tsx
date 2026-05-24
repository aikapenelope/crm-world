/**
 * AGM Exception: raw <form> — dynamic line items
 *
 * This form contains a dynamic array of line items (added/removed at runtime)
 * that CrudForm does not currently support (no repeatable field group).
 * Replacing with CrudForm would require a custom CrudFormGroupComponent
 * that manages its own state for the items array.
 *
 * Acceptable to keep as raw <form> until CrudForm adds native support for
 * repeatable groups, or until a dedicated line-item component is built.
 * All other AGM rules apply (Button components, apiCall, etc.).
 */
'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@open-mercato/ui/primitives/button'
import { Input } from '@open-mercato/ui/primitives/input'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react'

type ProjectOption = { id: string; name: string }
type LaborEntry = { trade: string; headcount: string; hours_worked: string; contractor_name: string }
type ActivityEntry = { area: string; description: string; quantity: string; unit: string; percent_complete: string }

export default function CreateDailyReportPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [projects, setProjects] = React.useState<ProjectOption[]>([])
  const [labor, setLabor] = React.useState<LaborEntry[]>([{ trade: '', headcount: '1', hours_worked: '8', contractor_name: '' }])
  const [activities, setActivities] = React.useState<ActivityEntry[]>([{ area: '', description: '', quantity: '', unit: '', percent_complete: '' }])
  const [form, setForm] = React.useState({
    project_id: '', report_date: new Date().toISOString().split('T')[0],
    weather: 'sunny', temperature_high: '', temperature_low: '',
    work_hours: '8', overall_notes: '',
    safety_incidents: '0', safety_notes: '', submitted_by: '',
  })

  React.useEffect(() => {
    async function load() {
      const res = await apiCall<{ items: ProjectOption[] }>('/api/const-projects/projects?pageSize=100', undefined, { fallback: { items: [] } })
      if (res.ok) setProjects(res.result?.items ?? [])
    }
    load()
  }, [])

  function set(field: string, value: string) { setForm((p) => ({ ...p, [field]: value })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)

    const reportResult = await apiCall<{ id: string }>('/api/const-daily/reports', {
      method: 'POST',
      body: JSON.stringify({
        ...form,
        temperature_high: form.temperature_high ? Number(form.temperature_high) : null,
        temperature_low: form.temperature_low ? Number(form.temperature_low) : null,
        safety_incidents: Number(form.safety_incidents),
        overall_notes: form.overall_notes || null,
        safety_notes: form.safety_notes || null,
        submitted_by: form.submitted_by || null,
      }),
    })

    if (!reportResult.ok) {
      flash('Error al crear el reporte', 'error')
      setIsSubmitting(false)
      return
    }

    const reportId = (reportResult.result as any)?.id

    // Save labor and activities
    await Promise.all([
      ...labor.filter((l) => l.trade).map((l) => apiCall('/api/const-daily/labor', {
        method: 'POST',
        body: JSON.stringify({ ...l, report_id: reportId, contractor_name: l.contractor_name || null }),
      })),
      ...activities.filter((a) => a.description).map((a) => apiCall('/api/const-daily/activities', {
        method: 'POST',
        body: JSON.stringify({ ...a, report_id: reportId, quantity: a.quantity || null, unit: a.unit || null, percent_complete: a.percent_complete || null }),
      })),
    ])

    flash('Reporte diario creado exitosamente', 'success')
    router.push('/backend/const_daily')
    setIsSubmitting(false)
  }

  const sel = (field: string, opts: { value: string; label: string }[]) => (
    <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
      value={(form as any)[field]} onChange={(e) => set(field, e.target.value)}>
      {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )

  return (
    <Page>
      <PageBody>
        <div className="mb-4 flex items-center gap-3">
          <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/const_daily')}>
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-2xl font-bold">Nuevo Reporte Diario de Obra</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <fieldset className="max-w-2xl rounded-lg border p-4">
            <legend className="px-2 text-sm font-semibold">Datos Generales</legend>
            <div className="mt-2 grid grid-cols-2 gap-3 md:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-medium">Proyecto *</label>
                {sel('project_id', [{ value: '', label: 'Seleccionar...' }, ...projects.map((p) => ({ value: p.id, label: p.name }))])}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Fecha *</label>
                <Input type="date" value={form.report_date} onChange={(e) => set('report_date', e.target.value)} required />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Clima</label>
                {sel('weather', [
                  { value: 'sunny', label: '☀️ Soleado' },
                  { value: 'cloudy', label: '☁️ Nublado' },
                  { value: 'rainy', label: '🌧️ Lluvioso' },
                  { value: 'windy', label: '💨 Ventoso' },
                  { value: 'foggy', label: '🌫️ Neblina' },
                ])}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Horas de Trabajo</label>
                <Input value={form.work_hours} onChange={(e) => set('work_hours', e.target.value)} placeholder="8" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Temp. Máx. (°C)</label>
                <Input type="number" value={form.temperature_high} onChange={(e) => set('temperature_high', e.target.value)} placeholder="32" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Temp. Mín. (°C)</label>
                <Input type="number" value={form.temperature_low} onChange={(e) => set('temperature_low', e.target.value)} placeholder="24" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Elaborado por</label>
                <Input value={form.submitted_by} onChange={(e) => set('submitted_by', e.target.value)} placeholder="Ing. Juan Pérez" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Incidentes de Seguridad</label>
                <Input type="number" value={form.safety_incidents} onChange={(e) => set('safety_incidents', e.target.value)} min="0" />
              </div>
            </div>
            {Number(form.safety_incidents) > 0 && (
              <div className="mt-2">
                <label className="mb-1 block text-xs font-medium text-destructive">Descripción de Incidentes *</label>
                <textarea className="flex min-h-[60px] w-full rounded-md border border-destructive bg-transparent px-3 py-2 text-sm"
                  value={form.safety_notes} onChange={(e) => set('safety_notes', e.target.value)} />
              </div>
            )}
          </fieldset>

          {/* Labor */}
          <fieldset className="rounded-lg border p-4">
            <legend className="px-2 text-sm font-semibold">Personal en Obra</legend>
            {labor.map((l, i) => (
              <div key={i} className="mb-2 grid grid-cols-4 gap-2">
                <div>
                  <label className="mb-1 block text-xs font-medium">Oficio</label>
                  <Input className="h-8 text-xs" value={l.trade}
                    onChange={(e) => setLabor((p) => { const n = [...p]; n[i] = { ...n[i], trade: e.target.value }; return n })}
                    placeholder="Albañil" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium">Cantidad</label>
                  <Input className="h-8 text-xs" type="number" value={l.headcount}
                    onChange={(e) => setLabor((p) => { const n = [...p]; n[i] = { ...n[i], headcount: e.target.value }; return n })} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium">Horas</label>
                  <Input className="h-8 text-xs" value={l.hours_worked}
                    onChange={(e) => setLabor((p) => { const n = [...p]; n[i] = { ...n[i], hours_worked: e.target.value }; return n })} />
                </div>
                <div className="flex items-end gap-1">
                  <div className="flex-1">
                    <label className="mb-1 block text-xs font-medium">Empresa</label>
                    <Input className="h-8 text-xs" value={l.contractor_name}
                      onChange={(e) => setLabor((p) => { const n = [...p]; n[i] = { ...n[i], contractor_name: e.target.value }; return n })}
                      placeholder="Sub-contratista" />
                  </div>
                  {i > 0 && (
                    <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive mb-0.5"
                      onClick={() => setLabor((p) => p.filter((_, j) => j !== i))}>
                      <Trash2 className="size-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm"
              onClick={() => setLabor((p) => [...p, { trade: '', headcount: '1', hours_worked: '8', contractor_name: '' }])}>
              <Plus className="mr-1 size-3" />Agregar Oficio
            </Button>
          </fieldset>

          {/* Activities */}
          <fieldset className="rounded-lg border p-4">
            <legend className="px-2 text-sm font-semibold">Actividades Realizadas</legend>
            {activities.map((a, i) => (
              <div key={i} className="mb-2 grid grid-cols-5 gap-2">
                <div>
                  <label className="mb-1 block text-xs font-medium">Área/Ubicación</label>
                  <Input className="h-8 text-xs" value={a.area}
                    onChange={(e) => setActivities((p) => { const n = [...p]; n[i] = { ...n[i], area: e.target.value }; return n })}
                    placeholder="Piso 3 - Ejes A-D" />
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-medium">Descripción *</label>
                  <Input className="h-8 text-xs" value={a.description}
                    onChange={(e) => setActivities((p) => { const n = [...p]; n[i] = { ...n[i], description: e.target.value }; return n })}
                    placeholder="Vaciado de losa de entrepiso" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium">Cant. / Unid.</label>
                  <div className="flex gap-1">
                    <Input className="h-8 w-16 text-xs" value={a.quantity}
                      onChange={(e) => setActivities((p) => { const n = [...p]; n[i] = { ...n[i], quantity: e.target.value }; return n })}
                      placeholder="45" />
                    <Input className="h-8 w-14 text-xs" value={a.unit}
                      onChange={(e) => setActivities((p) => { const n = [...p]; n[i] = { ...n[i], unit: e.target.value }; return n })}
                      placeholder="m²" />
                  </div>
                </div>
                <div className="flex items-end gap-1">
                  <div className="flex-1">
                    <label className="mb-1 block text-xs font-medium">% Avance</label>
                    <Input className="h-8 text-xs" value={a.percent_complete}
                      onChange={(e) => setActivities((p) => { const n = [...p]; n[i] = { ...n[i], percent_complete: e.target.value }; return n })}
                      placeholder="75" />
                  </div>
                  {i > 0 && (
                    <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive mb-0.5"
                      onClick={() => setActivities((p) => p.filter((_, j) => j !== i))}>
                      <Trash2 className="size-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm"
              onClick={() => setActivities((p) => [...p, { area: '', description: '', quantity: '', unit: '', percent_complete: '' }])}>
              <Plus className="mr-1 size-3" />Agregar Actividad
            </Button>
          </fieldset>

          <fieldset className="max-w-2xl rounded-lg border p-4">
            <legend className="px-2 text-sm font-semibold">Observaciones Generales</legend>
            <textarea className="mt-2 flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              value={form.overall_notes} onChange={(e) => set('overall_notes', e.target.value)}
              placeholder="Condiciones especiales, retrasos, observaciones del día..." />
          </fieldset>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => router.push('/backend/const_daily')}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              <Save className="mr-2 size-4" />
              {isSubmitting ? 'Guardando...' : 'Crear Reporte'}
            </Button>
          </div>
        </form>
      </PageBody>
    </Page>
  )
}
