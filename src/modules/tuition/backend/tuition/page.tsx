'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import type { ColumnDef } from '@tanstack/react-table'

type ChargeRow = {
  id: string
  student_id: string
  period_month: string
  concept: string
  amount: string
  currency: string
  status: string
  due_date: string
  amount_paid: string
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  partial: 'Parcial',
  paid: 'Pagado',
  overdue: 'Vencido',
  waived: 'Condonado',
  credited: 'Acreditado',
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  pending: 'outline',
  partial: 'secondary',
  paid: 'default',
  overdue: 'destructive',
  waived: 'secondary',
  credited: 'secondary',
}

const CONCEPT_LABELS: Record<string, string> = {
  mensualidad: 'Mensualidad',
  inscripcion: 'Inscripción',
  material: 'Material',
  uniforme: 'Uniforme',
  transporte: 'Transporte',
  evento: 'Evento',
  otro: 'Otro',
}

export default function TuitionListPage() {
  const router = useRouter()
  const [charges, setCharges] = React.useState<ChargeRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const call = await apiCall<{ items: ChargeRow[] }>(
        '/api/tuition/charges?pageSize=100',
        undefined,
        { fallback: { items: [] } },
      )
      if (call.ok) {
        setCharges(call.result?.items ?? [])
      }
      setIsLoading(false)
    }
    load()
  }, [])

  const columns: ColumnDef<ChargeRow>[] = [
    {
      accessorKey: 'period_month',
      header: 'Mes',
    },
    {
      accessorKey: 'concept',
      header: 'Concepto',
      cell: ({ row }) => CONCEPT_LABELS[row.original.concept] ?? row.original.concept,
    },
    {
      accessorKey: 'amount',
      header: 'Monto',
      cell: ({ row }) => `${row.original.currency} ${Number(row.original.amount).toLocaleString('es-VE')}`,
    },
    {
      accessorKey: 'amount_paid',
      header: 'Pagado',
      cell: ({ row }) => {
        const paid = Number(row.original.amount_paid)
        return paid > 0 ? `${row.original.currency} ${paid.toLocaleString('es-VE')}` : '—'
      },
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => (
        <Badge variant={STATUS_VARIANTS[row.original.status] ?? 'outline'}>
          {STATUS_LABELS[row.original.status] ?? row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: 'due_date',
      header: 'Vencimiento',
      cell: ({ row }) => new Date(row.original.due_date).toLocaleDateString('es-VE'),
    },
    {
      accessorKey: 'student_id',
      header: 'Estudiante',
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.student_id.slice(0, 8)}...</span>,
    },
  ]

  return (
    <Page>
      <PageBody>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Mensualidades</h1>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => router.push('/backend/tuition/generate')}>
              Generar Mes
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => router.push('/backend/tuition/plans')}>
              Planes
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => router.push('/backend/tuition/debtors')}>
              Morosos
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => router.push('/backend/tuition/siblings')}>
              Familias
            </Button>
            <Button type="button" variant="outline" size="sm" className="border-[#25D366] text-[#25D366]" onClick={() => router.push('/backend/tuition/cobro')}>
              WhatsApp
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => router.push('/backend/tuition/collection-day')}>
              Día de Cobro
            </Button>
            <Button type="button" onClick={() => router.push('/backend/tuition/payments')}>
              Registrar Pago
            </Button>
          </div>
        </div>
        <DataTable
          columns={columns}
          data={charges}
          isLoading={isLoading}
          searchPlaceholder="Buscar cargos..."
        />
      </PageBody>
    </Page>
  )
}
