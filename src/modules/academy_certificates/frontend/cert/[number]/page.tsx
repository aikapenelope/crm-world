'use client'

import * as React from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle2, XCircle, Award, Shield, Loader2 } from 'lucide-react'
import { useT } from '@open-mercato/shared/lib/i18n/context'

type CertData = {
  valid: boolean
  certificate_number?: string
  student_name?: string
  course_name?: string
  group_code?: string
  instructor_name?: string | null
  final_grade?: string | null
  attendance_percent?: string | null
  issued_at?: string | null
  issued_by?: string | null
  error?: string
}

export default function CertVerifyPage() {
  const t = useT()
  const params = useParams()
  const number = (params?.number as string ?? '').toUpperCase()
  const [cert, setCert] = React.useState<CertData | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    if (!number) { setIsLoading(false); return }
    async function verify() {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/academy-certificates/verify?number=${encodeURIComponent(number)}`)
        const data: CertData = await res.json()
        setCert(data)
      } catch {
        setCert({ valid: false, error: 'Error de conexión' })
      }
      setIsLoading(false)
    }
    verify()
  }, [number])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="size-8 animate-spin" />
          <p className="text-sm">{t('academy_certificates.public.loading', 'Verificando certificado...')}</p>
        </div>
      </div>
    )
  }

  if (!cert?.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-6">
        <div className="max-w-md w-full text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-destructive/10 p-5">
              <XCircle className="size-12 text-destructive" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2 text-destructive">{t('academy_certificates.public.invalid', 'Certificado no válido')}</h1>
          <p className="text-muted-foreground mb-4">
            No se encontró el certificado <span className="font-mono font-bold">{number}</span> en nuestros registros,
            o aún no ha sido emitido oficialmente.
          </p>
          <div className="rounded-lg border bg-background p-4 text-left">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="size-4" />
              Número consultado: <span className="font-mono font-medium text-foreground">{number}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const issuedDate = cert.issued_at
    ? new Date(cert.issued_at).toLocaleDateString('es-VE', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : null

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        {/* Verified badge */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5">
            <CheckCircle2 className="size-4 text-primary" />
            <span className="text-sm font-semibold text-primary">{t('academy_certificates.public.verified', 'Certificado verificado')}</span>
          </div>
        </div>

        {/* Certificate card */}
        <div className="rounded-2xl border-2 border-primary/20 bg-background shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-8 py-6 text-center border-b">
            <Award className="size-10 mx-auto mb-3 text-primary" />
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
              Certificado de Completación
            </div>
            <div className="font-mono text-sm text-muted-foreground">{cert.certificate_number}</div>
          </div>

          {/* Content */}
          <div className="px-8 py-6 text-center">
            <div className="text-xs text-muted-foreground mb-1">Este certificado acredita que</div>
            <h1 className="text-3xl font-bold mb-4">{cert.student_name}</h1>

            <div className="text-sm text-muted-foreground mb-1">completó satisfactoriamente</div>
            <div className="text-xl font-semibold text-foreground mb-1">{cert.course_name}</div>
            {cert.group_code && (
              <div className="text-sm text-muted-foreground mb-4">Grupo {cert.group_code}</div>
            )}

            {/* Grade badge */}
            {cert.final_grade && (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary mb-4">
                {cert.final_grade}
              </div>
            )}

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-4 border-t pt-4 mt-4 text-sm">
              {cert.instructor_name && (
                <div className="text-left">
                  <div className="text-xs text-muted-foreground mb-0.5">Instructor</div>
                  <div className="font-medium">{cert.instructor_name}</div>
                </div>
              )}
              {cert.attendance_percent && (
                <div className="text-left">
                  <div className="text-xs text-muted-foreground mb-0.5">Asistencia</div>
                  <div className="font-medium">{cert.attendance_percent}%</div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t bg-muted/30 px-8 py-4 text-center">
            {issuedDate && (
              <div className="text-xs text-muted-foreground">
                Emitido el {issuedDate}
                {cert.issued_by && ` — ${cert.issued_by}`}
              </div>
            )}
            <div className="flex items-center justify-center gap-1.5 text-xs text-primary mt-1">
              <Shield className="size-3" />
              <span>Verificado como auténtico</span>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Este certificado fue emitido y verificado digitalmente.
          El número {cert.certificate_number} puede ser consultado en cualquier momento.
        </p>
      </div>
    </div>
  )
}
