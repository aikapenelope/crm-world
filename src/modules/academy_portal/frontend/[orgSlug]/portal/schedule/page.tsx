'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import { ArrowLeft, Calendar, BookOpen } from 'lucide-react'

type Props = { params: { orgSlug: string } }


type Session = {
  id: string; session_number: number; session_date: string; start_time: string
  end_time: string; topic: string | null; session_type: string
  group_code: string; course_name: string; online_link: string | null; location: string | null
}

const SESSION_TYPE_LABELS: Record<string, string> = {
  theory: 'Teoría', practice: 'Práctica', exam: 'Examen', orientation: 'Orientación', makeup: 'Recuperación',
}

export default function AcademyPortalSchedulePage({ params }: Props) {
  const router = useRouter()
  const [sessions, setSessions] = React.useState<Session[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const url = new URL(window.location.href)
    const phone = url.searchParams.get('phone') ?? ''
    const eid = url.searchParams.get('enrollment_id') ?? ''
    const param = eid ? `enrollment_id=${eid}` : `phone=${encodeURIComponent(phone)}`
    if (!phone && !eid) { setIsLoading(false); return }

    async function load() {
      setIsLoading(true)
      const res = await apiCall<{ items: Session[] }>(
        `/api/academy-portal/schedule?${param}`, undefined, { fallback: { items: [] } })
      setSessions(res.result?.items ?? [])
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

  // Group sessions by date
  const byDate = sessions.reduce((acc, s) => {
    const d = s.session_date
    if (!acc[d]) acc[d] = []
    acc[d].push(s)
    return acc
  }, {} as Record<string, Session[]>)

  return (
    <div className="mx-auto max-w-xl p-6">
      <div className="mb-6 flex items-center gap-3">
        <Button type="button" variant="ghost" size="sm" onClick={() => router.push(backUrl())}>
          <ArrowLeft className="mr-2 h-4 w-4" />Inicio
        </Button>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Calendar className="size-5" />Próximas clases
        </h1>
      </div>

      {isLoading && <div className="text-center py-8 text-muted-foreground">Cargando...</div>}
      {!isLoading && sessions.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">No hay clases próximas en los siguientes 30 días.</div>
      )}

      <div className="space-y-6">
        {Object.entries(byDate).map(([date, dateSessions]) => (
          <div key={date}>
            <div className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
              {new Date(date).toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
            <div className="space-y-2">
              {dateSessions.map(s => (
                <div key={s.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{s.course_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {s.start_time} – {s.end_time} · {s.group_code}
                      </div>
                      {s.topic && <div className="text-xs text-muted-foreground mt-0.5">{s.topic}</div>}
                      {s.location && <div className="text-xs text-muted-foreground">{s.location}</div>}
                    </div>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {SESSION_TYPE_LABELS[s.session_type] ?? s.session_type}
                    </Badge>
                  </div>
                  {s.online_link && (
                    <a href={s.online_link} target="_blank" rel="noopener noreferrer"
                      className="mt-2 block text-xs text-primary hover:underline">
                      Unirse online →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
