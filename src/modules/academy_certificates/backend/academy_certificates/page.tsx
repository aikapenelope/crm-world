'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import type { ColumnDef } from '@tanstack/react-table'
import { Award, CheckCircle2 } from 'lucide-react'

type CertRow = {
  id: string
  certificate_number: string
  student_name: string
  course_name: string
  group_code: string
  instructor_name: string
  final_grade: string | null
  attendance_percent: string | null
  status: string
  issued_at: string | null
  issued_by: string | null
  created_at: string
}

export default function AcademyCertificatesPage() {
  const router = useRouter()
  const [certs, setCerts] = React.useState<CertRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [filterStatus, setFilterStatus] = React.useState('all')
  const [issuingId, setIssuingId] = React.useState<string | null>(null)

  async function load() {
    setIsLoading(true)
    const res = await apiCall<{ items: CertRow[] }>('/api/academy-certificates/certificates?pageSize=200', undefined, { fallback: { items: [] } })
    setCerts(res.result?.items ?? [])
    setIsLoading(false)
  }

  React.useEffect(() => { load() }, [])

  async function handleIssue(certId: string) {
    setIssuingId(certId)
    const res = await apiCall('/api/academy-certificates/certificates/issue', {
      method: 'POST',
      body: JSON.stringify({ certificate_id: certId }),
    })
    if (res.ok) {
      flash(`Certificado emitido: ${(res.result as any)?.certificate_number}`, 'success')
      await load()
    } else {
      flash('Error al emitir certificado', 'error')
    }
    setIssuingId(null)
  }

  const filtered = filterStatus === 'all' ? certs : certs.filter(c => c.status === filterStatus)
  const pending = certs.filter(c => c.status === 'pending').length
  const issued = certs.filter(c => c.status === 'issued').length

  const columns: ColumnDef<CertRow>[] = [
    {
      header: 'Certificado',
      accessorKey: 'certificate_number',
      cell: ({ row }) => (
        <div>
          <div className="font-mono font-medium text-sm">{row.original.certificate_number}</div>
          <div className="text-xs text-muted-foreground">
            {row.original.issued_at
              ? `Emitido ${new Date(row.original.issued_at).toLocaleDateString('es-VE')}`
              : `Generado ${new Date(row.original.created_at).toLocaleDateString('es-VE')}`}
          </div>
        </div>
      ),
    },
    {
      header: 'Alumno',
      accessorKey: 'student_name',
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-sm">{row.original.student_name}</div>
          <div className="text-xs text-muted-foreground">{row.original.course_name} · {row.original.group_code}</div>
        </div>
      ),
    },
    {
      header: 'Instructor',
      accessorKey: 'instructor_name',
      cell: ({ row }) => <span className="text-sm">{row.original.instructor_name || '—'}</span>,
    },
    {
      header: 'Asistencia',
      accessorKey: 'attendance_percent',
      cell: ({ row }) => row.original.attendance_percent ? `${row.original.attendance_percent}%` : '—',
    },
    {
      header: 'Nota',
      accessorKey: 'final_grade',
      cell: ({ row }) => row.original.final_grade ?? '—',
    },
    {
      header: 'Estado',
      accessorKey: 'status',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Badge variant={row.original.status === 'issued' ? 'secondary' : 'outline'}>
            {row.original.status === 'issued' ? 'Emitido' : row.original.status === 'revoked' ? 'Revocado' : 'Pendiente'}
          </Badge>
          {row.original.status === 'pending' && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={issuingId === row.original.id}
              onClick={(e) => { e.stopPropagation(); handleIssue(row.original.id) }}
            >
              <CheckCircle2 className="mr-1 size-3" />
              {issuingId === row.original.id ? '...' : 'Emitir'}
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <Page>
      <PageBody>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Award className="size-6" />Certificados
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {pending} pendientes de emitir · {issued} emitidos
            </p>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          {['all', 'pending', 'issued'].map(f => (
            <Button key={f} type="button" variant={filterStatus === f ? 'default' : 'outline'} size="sm"
              onClick={() => setFilterStatus(f)}>
              {f === 'all' ? 'Todos' : f === 'pending' ? 'Pendientes' : 'Emitidos'}
            </Button>
          ))}
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          isLoading={isLoading}
          searchPlaceholder="Buscar alumno o certificado..."
          onRowClick={(row) => router.push(`/backend/academy_certificates/${row.id}`)}
        />
      </PageBody>
    </Page>
  )
}
