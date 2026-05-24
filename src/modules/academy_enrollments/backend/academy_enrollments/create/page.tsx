/**
 * AGM Exception: raw <form> — dynamic options + computed values from API
 *
 * This form loads select options from one or more API endpoints at runtime
 * and computes derived values (e.g. remaining balance, enriched labels).
 * CrudForm supports dynamic options arrays, but the pre-processing logic
 * (cross-joining multiple API results, computing derived fields) would require
 * a custom CrudFormGroupComponent that duplicates significant non-form logic.
 *
 * Acceptable to keep raw <form> here. All other AGM rules apply:
 * - Button / input components from @open-mercato/ui
 * - apiCall / createCrud for HTTP calls
 * - flash for feedback
 * Migrate when CrudForm adds an onBeforeRender hook for option enrichment.
 */
'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { createCrud } from '@open-mercato/ui/backend/utils/crud'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { Button } from '@open-mercato/ui/primitives/button'
import { ArrowLeft } from 'lucide-react'

export default function AcademyEnrollmentCreatePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const presetGroupId = searchParams?.get('group_id') ?? ''

  const [groups, setGroups] = React.useState<{ id: string; group_code: string; course_name?: string; price_usd?: string; enrolled_count: number; max_students: number }[]>([])
  const [groupId, setGroupId] = React.useState(presetGroupId)
  const [studentName, setStudentName] = React.useState('')
  const [studentEmail, setStudentEmail] = React.useState('')
  const [studentPhone, setStudentPhone] = React.useState('')
  const [priceAgreed, setPriceAgreed] = React.useState('')
  const [status, setStatus] = React.useState<'pending_payment' | 'active'>('active')
  const [notes, setNotes] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    async function load() {
      const [gRes, cRes] = await Promise.all([
        apiCall<{ items: any[] }>('/api/academy-groups/groups?pageSize=200&status=in_progress', undefined, { fallback: { items: [] } }),
        apiCall<{ items: any[] }>('/api/academy-courses/courses?pageSize=200', undefined, { fallback: { items: [] } }),
      ])
      const courseMap: Record<string, any> = {}
      for (const c of (cRes.result?.items ?? [])) courseMap[c.id] = c

      const enriched = (gRes.result?.items ?? []).map((g: any) => ({
        ...g,
        course_name: courseMap[g.course_id]?.name ?? '',
        price_usd: courseMap[g.course_id]?.price_usd ?? '',
      }))
      setGroups(enriched)

      if (presetGroupId) {
        const g = enriched.find((g: any) => g.id === presetGroupId)
        if (g?.price_usd) setPriceAgreed(String(Number(g.price_usd).toFixed(2)))
      }
    }
    load()
  }, [presetGroupId])

  // Update suggested price when group changes
  function handleGroupChange(id: string) {
    setGroupId(id)
    const g = groups.find(g => g.id === id)
    if (g?.price_usd) setPriceAgreed(String(Number(g.price_usd).toFixed(2)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!groupId || !studentName || !priceAgreed) {
      flash('Completa grupo, nombre del alumno y precio', 'error')
      return
    }
    const selectedGroup = groups.find(g => g.id === groupId)
    if (selectedGroup && selectedGroup.enrolled_count >= selectedGroup.max_students) {
      flash('El grupo está lleno', 'error')
      return
    }
    setSaving(true)
    const res = await createCrud('academy-enrollments/enrollments', {
      group_id: groupId,
      student_name: studentName,
      student_email: studentEmail || null,
      student_phone: studentPhone || null,
      price_agreed: priceAgreed,
      currency: 'USD',
      status,
      notes: notes || null,
    })
    const created = res.result as { id?: string } | undefined
    if (res.ok && created?.id) {
      flash('Alumno inscrito', 'success')
      router.push(`/backend/academy_enrollments/${created.id}`)
    } else {
      flash('Error al inscribir el alumno', 'error')
    }
    setSaving(false)
  }

  const selectedGroup = groups.find(g => g.id === groupId)

  return (
    <Page>
      <PageBody>
        <Button variant="ghost" size="sm" onClick={() => router.push('/backend/academy_enrollments')}>
          <ArrowLeft className="mr-2 h-4 w-4" />Inscripciones
        </Button>
        <h1 className="mt-4 mb-6 text-2xl font-bold">Inscribir alumno</h1>

        <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
          {/* Group selection */}
          <div className="rounded-lg border p-4 space-y-3">
            <h3 className="font-semibold text-sm">Grupo</h3>
            <select value={groupId} onChange={e => handleGroupChange(e.target.value)} required
              className="w-full rounded-md border bg-background px-3 py-2 text-sm">
              <option value="">Seleccionar grupo...</option>
              {groups.map(g => (
                <option key={g.id} value={g.id} disabled={g.enrolled_count >= g.max_students}>
                  {g.group_code}{g.course_name ? ` — ${g.course_name}` : ''}
                  {g.enrolled_count >= g.max_students ? ' (lleno)' : ` (${g.enrolled_count}/${g.max_students})`}
                </option>
              ))}
            </select>
            {selectedGroup && (
              <div className="text-xs text-muted-foreground">
                {selectedGroup.enrolled_count}/{selectedGroup.max_students} alumnos inscritos
                {selectedGroup.enrolled_count >= selectedGroup.max_students && (
                  <span className="text-destructive"> · GRUPO LLENO</span>
                )}
              </div>
            )}
          </div>

          {/* Student data */}
          <div className="rounded-lg border p-4 space-y-4">
            <h3 className="font-semibold text-sm">Datos del alumno</h3>
            <div>
              <label className="text-sm font-medium block mb-1">Nombre completo *</label>
              <input type="text" value={studentName} onChange={e => setStudentName(e.target.value)} required
                placeholder="Ana García"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1">Email</label>
                <input type="email" value={studentEmail} onChange={e => setStudentEmail(e.target.value)}
                  placeholder="ana@email.com"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">WhatsApp</label>
                <input type="text" value={studentPhone} onChange={e => setStudentPhone(e.target.value)}
                  placeholder="+58 412 000 0000"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="rounded-lg border p-4 space-y-4">
            <h3 className="font-semibold text-sm">Pago y estado</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1">Precio acordado (USD) *</label>
                <input type="number" value={priceAgreed} onChange={e => setPriceAgreed(e.target.value)}
                  min="0" step="0.01" required
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Estado inicial</label>
                <select value={status} onChange={e => setStatus(e.target.value as any)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                  <option value="active">Activo (ya pagó)</option>
                  <option value="pending_payment">Pendiente de pago</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Notas</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                placeholder="Descuentos aplicados, acuerdo especial, referido por..."
                className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none" />
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => router.push('/backend/academy_enrollments')}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Inscribiendo...' : 'Inscribir alumno'}
            </Button>
          </div>
        </form>
      </PageBody>
    </Page>
  )
}
