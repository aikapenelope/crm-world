'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { Button } from '@open-mercato/ui/primitives/button'
import { ClipboardCheck, BarChart3 } from 'lucide-react'
import { useT } from '@open-mercato/shared/lib/i18n/context'

export default function AttendanceMainPage() {
  const t = useT()
  const router = useRouter()

  return (
    <Page>
      <PageBody>
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <ClipboardCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t('attendance.main.title', 'Asistencia')}</h1>
            <p className="text-sm text-muted-foreground">{t('attendance.main.subtitle', 'Registro diario y reportes mensuales')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            type="button"
            variant="outline"
            className="h-auto rounded-lg border p-6 text-left flex flex-col items-start gap-3 hover:bg-muted/30"
            onClick={() => router.push('/backend/attendance/daily')}
          >
            <ClipboardCheck className="h-8 w-8 text-primary" />
            <div>
              <h2 className="text-lg font-semibold mb-1">{t('attendance.main.daily.title', 'Registro Diario')}</h2>
              <p className="text-sm text-muted-foreground">
                {t('attendance.main.daily.desc', 'Pasar lista por sección para el día de hoy')}
              </p>
            </div>
          </Button>

          <Button
            type="button"
            variant="outline"
            className="h-auto rounded-lg border p-6 text-left flex flex-col items-start gap-3 hover:bg-muted/30"
            onClick={() => router.push('/backend/attendance/reports')}
          >
            <BarChart3 className="h-8 w-8 text-primary" />
            <div>
              <h2 className="text-lg font-semibold mb-1">{t('attendance.main.reports.title', 'Reportes')}</h2>
              <p className="text-sm text-muted-foreground">
                {t('attendance.main.reports.desc', 'Resumen mensual de asistencia por grado y sección')}
              </p>
            </div>
          </Button>
        </div>
      </PageBody>
    </Page>
  )
}
