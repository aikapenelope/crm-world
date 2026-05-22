'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import { ArrowLeft, Award, CheckCircle2 } from 'lucide-react'

type Props = { params: { orgSlug: string } }


type Certificate = {
  id: string; certificate_number: string; course_name: string; group_code: string
  instructor_name: string; final_grade: string | null; attendance_percent: string | null
  issued_at: string | null; issued_by: string | null
}

export default function AcademyPortalCertificatesPage({ params }: Props) {
  const router = useRouter()
  const [certs, setCerts] = React.useState<Certificate[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const url = new URL(window.location.href)
    const phone = url.searchParams.get('phone') ?? ''
    const eid = url.searchParams.get('enrollment_id') ?? ''
    const param = eid ? `enrollment_id=${eid}` : `phone=${encodeURIComponent(phone)}`
    if (!phone && !eid) { setIsLoading(false); return }

    async function load() {
      setIsLoading(true)
      const res = await apiCall<{ items: Certificate[] }>(
        `/api/academy-portal/certificates?${param}`, undefined, { fallback: { items: [] } })
      setCerts(res.result?.items ?? [])
      setIsLoading(false)
    }
    load()
  }, [])

  function backUrl() {
    const url = new URL(window.location.href)
    const p = url.searchParams.get('phone') ?? ''
    const eid = url.searchParams.get('enrollment_id') ?? ''
    return eid ? `/${params.orgSlug}/portal/dashboard?enrollment_id=${eid}` : `/${params.orgSlug}/portal/dashboard?phone=${encodeURIComponent(p)}`
  }

  return (
    <div className="mx-auto max-w-xl p-6">
      <div className="mb-6 flex items-center gap-3">
        <Button type="button" variant="ghost" size="sm" onClick={() => router.push(backUrl())}>
          <ArrowLeft className="mr-2 h-4 w-4" />Inicio
        </Button>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Award className="size-5" />Mis certificados
        </h1>
      </div>

      {isLoading && <div className="text-center py-8 text-muted-foreground">Cargando...</div>}
      {!isLoading && certs.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">Aún no tienes certificados emitidos.</div>
      )}

      <div className="space-y-4">
        {certs.map(c => (
          <div key={c.id} className="rounded-xl border-2 border-primary/20 p-6">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="size-5 text-primary" />
              <span className="font-mono text-sm text-muted-foreground">{c.certificate_number}</span>
            </div>
            <div className="text-center py-2">
              <div className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Certificado de Completación</div>
              <div className="text-xl font-bold mb-1">{c.course_name}</div>
              <div className="text-sm text-muted-foreground mb-3">{c.group_code}</div>
              {c.final_grade && (
                <div className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-3 py-0.5 text-sm font-medium text-primary mb-3">
                  {c.final_grade}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground pt-3 border-t border-primary/10">
                <div>
                  <div className="font-medium text-foreground mb-0.5">Instructor</div>
                  {c.instructor_name || '—'}
                </div>
                <div>
                  <div className="font-medium text-foreground mb-0.5">Asistencia</div>
                  {c.attendance_percent ? `${c.attendance_percent}%` : '—'}
                </div>
              </div>
            </div>
            {c.issued_at && (
              <div className="text-center text-xs text-muted-foreground mt-3 pt-3 border-t border-primary/10">
                Emitido el {new Date(c.issued_at).toLocaleDateString('es-VE', { day: 'numeric', month: 'long', year: 'numeric' })}
                {c.issued_by && ` — ${c.issued_by}`}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
