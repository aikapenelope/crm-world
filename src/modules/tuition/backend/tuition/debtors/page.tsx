'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import type { ColumnDef } from '@tanstack/react-table'
import { AlertTriangle, MessageCircle, FileText, DollarSign } from 'lucide-react'

type DebtorRow = {
  chargeId: string
  studentId: string
  studentName: string
  gradeLabel: string
  section: string
  representativeName: string
  phone: string | null
  amount: string
  currency: string
  periodMonth: string
  dueDate: string
  lateFee: string
  waLink: string | null
}

export default function DebtorsPage() {
  const router = useRouter()
  const [debtors, setDebtors] = React.useState<DebtorRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const call = await apiCall<{ items: DebtorRow[]; total: number }>(
        '/api/tuition/whatsapp-cobro?status=overdue',
        undefined,
        { fallback: { items: [], total: 0 } },
      )
      if (call.ok) {
        setDebtors(call.result?.items ?? [])
      }
      setIsLoading(false)
    }
    load()
  }, [])

  // Calculate totals
  const totalDebt = debtors.reduce((sum, d) => sum + Number(d.amount) + Number(d.lateFee), 0)
  const uniqueStudents = new Set(debtors.map((d) => d.studentId)).size

  const columns: ColumnDef<DebtorRow>[] = [
    {
      accessorKey: 'studentName',
      header: 'Estudiante',
      cell: ({ row }) => (
        <button
          className="font-medium text-primary hover:underline"
          onClick={() => router.push(`/backend/tuition/account?student_id=${row.original.studentId}`)}
        >
          {row.original.studentName}
        </button>
      ),
    },
    {
      accessorKey: 'gradeLabel',
      header: 'Grado',
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">
          {row.original.gradeLabel} - {row.original.section}
        </Badge>
      ),
    },
    {
      accessorKey: 'representativeName',
      header: 'Representante',
    },
    {
      accessorKey: 'periodMonth',
      header: 'Mes',
    },
    {
      accessorKey: 'amount',
      header: 'Deuda',
      cell: ({ row }) => {
        const total = Number(row.original.amount) + Number(row.original.lateFee)
        return (
          <div>
            <span className="font-bold text-destructive">
              {row.original.currency} {total.toLocaleString('es-VE')}
            </span>
            {Number(row.original.lateFee) > 0 && (
              <div className="text-xs text-muted-foreground">
                +{row.original.currency} {Number(row.original.lateFee).toLocaleString('es-VE')} recargo
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'dueDate',
      header: 'Venció',
      cell: ({ row }) => (
        <span className="text-sm text-destructive">{row.original.dueDate}</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          {row.original.waLink && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-[#25D366] hover:text-[#25D366] hover:bg-[#25D366]/10"
              onClick={() => window.open(row.original.waLink!, '_blank')}
              title="Cobrar por WhatsApp"
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => router.push(`/backend/tuition/account?student_id=${row.original.studentId}`)}
            title="Ver estado de cuenta"
          >
            <FileText className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <Page>
      <PageBody>
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Morosos</h1>
              <p className="text-sm text-muted-foreground">Estudiantes con cargos vencidos</p>
            </div>
          </div>
          <Button
            type="button"
            className="bg-[#25D366] hover:bg-[#25D366]/90 text-white"
            onClick={() => router.push('/backend/tuition/cobro')}
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Cobrar por WhatsApp
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="mb-4 grid grid-cols-3 gap-4">
          <div className="rounded-lg border p-4 text-center">
            <div className="text-2xl font-bold text-destructive">{uniqueStudents}</div>
            <div className="text-xs text-muted-foreground">Estudiantes morosos</div>
          </div>
          <div className="rounded-lg border p-4 text-center">
            <div className="text-2xl font-bold">{debtors.length}</div>
            <div className="text-xs text-muted-foreground">Cargos vencidos</div>
          </div>
          <div className="rounded-lg border p-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <DollarSign className="h-4 w-4 text-destructive" />
              <span className="text-2xl font-bold text-destructive">
                {totalDebt.toLocaleString('es-VE')}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">Total adeudado (USD)</div>
          </div>
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={debtors}
          isLoading={isLoading}
          searchPlaceholder="Buscar morosos..."
        />
      </PageBody>
    </Page>
  )
}
