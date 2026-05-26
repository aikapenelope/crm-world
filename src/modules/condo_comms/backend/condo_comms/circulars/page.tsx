'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import type { ColumnDef } from '@tanstack/react-table'
import { Button } from '@open-mercato/ui/primitives/button'
import { Plus } from 'lucide-react'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { useOrganizationScopeVersion } from '@open-mercato/shared/lib/frontend/useOrganizationScope'

type Row = Record<string, unknown> & { id: string }

export default function CircularesPage() {
  const router = useRouter()
  const [rows, setRows] = React.useState<Row[]>([])
  const [loading, setLoading] = React.useState(true)
  const version = useOrganizationScopeVersion()

  React.useEffect(() => {
    setLoading(true)
    apiCall('/api/condo-comms/circulars?pageSize=50', { method: 'GET' })
      .then((data: any) => setRows(data?.items ?? []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false))
  }, [version])

  const columns: ColumnDef<Row>[] = React.useMemo(() => [
    { accessorKey: 'id', header: 'ID', cell: ({ getValue }) => (getValue() as string).slice(0, 8) + '…' },
  ], [])

  return (
    <Page>
      <PageBody>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">Circulares</h1>
          <Button type="button" variant="outline" size="sm" onClick={() => router.push('/backend/condo_comms')}>
            ← Volver
          </Button>
        </div>
        <DataTable
          columns={columns}
          data={rows}
          loading={loading}
          
          
        />
      </PageBody>
    </Page>
  )
}
