'use client'

import * as React from 'react'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import type { ColumnDef } from '@tanstack/react-table'
import { ArrowLeft, BarChart3 } from 'lucide-react'
import { useT } from '@open-mercato/shared/lib/i18n/context'

type SummaryRow = {
  id: string
  student_id: string
  month: string
  days_present: number
  days_absent: number
  days_late: number
  days_excused: number
  attendance_percentage: string
}

export default function AttendanceReportsPage() {
  const t = useT()
  const [summaries, setSummaries] = React.useState<SummaryRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const call = await apiCall<{ items: SummaryRow[] }>('/api/attendance/summary?pageSize=100', undefined, { fallback: { items: [] } })
      if (call.ok) setSummaries(call.result?.items ?? [])
      setIsLoading(false)
    }
    load()
  }, [])

  const columns: ColumnDef<SummaryRow>[] = [
    { accessorKey: 'month', header: t('attendance.reports.col.month', 'Mes') },
    { accessorKey: 'student_id', header: t('attendance.reports.col.student', 'Estudiante'), cell: ({ row }) => <span className="font-mono text-xs">{row.original.student_id.slice(0, 8)}...</span> },
    { accessorKey: 'days_present', header: t('attendance.reports.col.present', 'Presentes') },
    { accessorKey: 'days_absent', header: t('attendance.reports.col.absent', 'Ausencias') },
    { accessorKey: 'days_late', header: t('attendance.reports.col.late', 'Tardanzas') },
    { accessorKey: 'days_excused', header: t('attendance.reports.col.excused', 'Justificados') },
    {
      accessorKey: 'attendance_percentage',
      header: t('attendance.reports.col.pct', '% Asistencia'),
      cell: ({ row }) => {
        const pct = Number(row.original.attendance_percentage)
        return <Badge variant={pct >= 80 ? 'default' : pct >= 60 ? 'secondary' : 'destructive'}>{pct.toFixed(1)}%</Badge>
      },
    },
  ]

  return (
    <Page>
      <PageBody>
        <div className="mb-4 flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('attendance.reports.back', 'Volver')}
          </Button>
          <BarChart3 className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">{t('attendance.reports.title', 'Reportes de Asistencia')}</h1>
        </div>
        <DataTable columns={columns} data={summaries} isLoading={isLoading} searchPlaceholder={t('attendance.reports.search', 'Buscar...')} />
      </PageBody>
    </Page>
  )
}
