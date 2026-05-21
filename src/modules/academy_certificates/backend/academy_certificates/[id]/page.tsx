'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { LoadingMessage } from '@open-mercato/ui/backend/detail'
import { ArrowLeft, Award, CheckCircle2, Printer } from 'lucide-react'

type Certificate = {
  id: string; certificate_number: string; enrollment_id: string
  course_name: string; group_code: string; instructor_name: string
  student_name: string; issued_at: string | null; final_grade: string | null
  attendance_percent: string | null; template_type: string; status: string
  issued_by: string | null; notes: string | null; created_at: string
}

export default function AcademyCertificateDetailPage() {
  const params = useParams()
  const router = useRouter()
  const certId = params?.id as string
  const [cert, setCert] = React.useState<Certificate | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [issuing, setIssuing] = React.useState(false)
  const [issuedBy, setIssuedBy] = React.useState('')

  async function load() {
    setIsLoading(true)
    const res = await apiCall<{ items: Certificate[] }>(
      `/api/academy-certificates/certificates?id=${certId}`, undefined, { fallback: { items: [] } })
    setCert(res.result?.items?.[0] ?? null)
    setIsLoading(false)
  }

  React.useEffect(() => { if (certId) load() }, [certId])

  async function handleIssue() {
    setIssuing(true)
    const res = await apiCall('/api/academy-certificates/certificates/issue', {
      method: 'POST',
      body: JSON.stringify({ certificate_id: certId, issued_by: issuedBy || null }),
    })
    if (res.ok) {
      flash('Certificado emitido exitosamente', 'success')
      await load()
    } else {
      flash((res.result as any)?.error ?? 'Error al emitir', 'error')
    }
    setIssuing(false)
  }

  if (isLoading) return <LoadingMessage label="Cargando certificado..." />
  if (!cert) return (
    <Page><PageBody>
      <Button variant="ghost" size="sm" onClick={() => router.push('/backend/academy_certificates')}>
        <ArrowLeft className="mr-2 h-4 w-4" />Volver
      </Button>
      <p className="mt-4 text-muted-foreground">Certificado no encontrado.</p>
    </PageBody></Page>
  )

  return (
    <Page>
      <PageBody>
        <Button variant="ghost" size="sm" onClick={() => router.push('/backend/academy_certificates')}>
          <ArrowLeft className="mr-2 h-4 w-4" />Certificados
        </Button>

        <div className="mt-4 mb-6 flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Award className="size-6 text-muted-foreground" />
              <h1 className="text-xl font-bold font-mono">{cert.certificate_number}</h1>
              <Badge variant={cert.status === 'issued' ? 'secondary' : 'outline'}>
                {cert.status === 'issued' ? 'Emitido' : cert.status === 'revoked' ? 'Revocado' : 'Pendiente'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Generado el {new Date(cert.created_at).toLocaleDateString('es-VE')}
            </p>
          </div>
          {cert.status !== 'issued' && cert.status !== 'revoked' && (
            <Button type="button" size="sm" onClick={handleIssue} disabled={issuing}>
              <CheckCircle2 className="mr-2 size-4" />
              {issuing ? 'Emitiendo...' : 'Emitir certificado'}
            </Button>
          )}
          {cert.status === 'issued' && (
            <Button type="button" variant="outline" size="sm">
              <Printer className="mr-2 size-4" />Imprimir
            </Button>
          )}
        </div>

        {/* Certificate preview card */}
        <div className="rounded-xl border-2 border-primary/20 p-8 mb-6 text-center bg-gradient-to-b from-primary/5 to-transparent">
          <div className="text-xs text-muted-foreground uppercase tracking-widest mb-4">Certificado de Completación</div>
          <div className="text-3xl font-bold mb-2">{cert.student_name}</div>
          <div className="text-muted-foreground mb-4">ha completado satisfactoriamente</div>
          <div className="text-xl font-semibold mb-1">{cert.course_name}</div>
          <div className="text-sm text-muted-foreground mb-6">Grupo: {cert.group_code}</div>

          {cert.final_grade && (
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1 mb-4">
              <span className="text-sm font-medium text-primary">{cert.final_grade}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm mt-6 border-t border-primary/10 pt-4">
            <div>
              <div className="text-muted-foreground text-xs mb-1">Instructor</div>
              <div className="font-medium">{cert.instructor_name || '—'}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs mb-1">Asistencia</div>
              <div className="font-medium">{cert.attendance_percent ? `${cert.attendance_percent}%` : '—'}</div>
            </div>
          </div>

          {cert.status === 'issued' && cert.issued_at && (
            <div className="mt-4 text-xs text-muted-foreground">
              Emitido el {new Date(cert.issued_at).toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              {cert.issued_by && ` por ${cert.issued_by}`}
            </div>
          )}
        </div>

        {/* Issue form (only for pending) */}
        {cert.status === 'pending' && (
          <div className="rounded-lg border p-4 space-y-3">
            <h3 className="font-semibold text-sm">Emisión</h3>
            <div>
              <label className="text-sm font-medium block mb-1">Emitido por (opcional)</label>
              <input type="text" value={issuedBy} onChange={e => setIssuedBy(e.target.value)}
                placeholder="Director académico, Coordinador..."
                className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
            </div>
            <p className="text-xs text-muted-foreground">
              Al emitir, el certificado queda registrado con fecha y firmante. Esta acción no puede deshacerse sin revocación explícita.
            </p>
            <Button type="button" size="sm" onClick={handleIssue} disabled={issuing}>
              <CheckCircle2 className="mr-2 size-4" />
              {issuing ? 'Emitiendo...' : 'Confirmar emisión'}
            </Button>
          </div>
        )}
      </PageBody>
    </Page>
  )
}
