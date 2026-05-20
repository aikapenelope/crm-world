'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { Button } from '@open-mercato/ui/primitives/button'
import { ClipboardCheck, BarChart3 } from 'lucide-react'

export default function AttendanceMainPage() {
  const router = useRouter()

  return (
    <Page>
      <PageBody>
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <ClipboardCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Asistencia</h1>
            <p className="text-sm text-muted-foreground">Registro diario y reportes mensuales</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            className="rounded-lg border p-6 text-left hover:bg-muted/30 transition-colors"
            onClick={() => router.push('/backend/attendance/daily')}
          >
            <ClipboardCheck className="h-8 w-8 text-primary mb-3" />
            <h2 className="text-lg font-semibold mb-1">Registro Diario</h2>
            <p className="text-sm text-muted-foreground">
              Pasar lista por sección para el día de hoy
            </p>
          </button>

          <button
            className="rounded-lg border p-6 text-left hover:bg-muted/30 transition-colors"
            onClick={() => router.push('/backend/attendance/reports')}
          >
            <BarChart3 className="h-8 w-8 text-primary mb-3" />
            <h2 className="text-lg font-semibold mb-1">Reportes</h2>
            <p className="text-sm text-muted-foreground">
              Resumen mensual de asistencia por grado y sección
            </p>
          </button>
        </div>
      </PageBody>
    </Page>
  )
}
