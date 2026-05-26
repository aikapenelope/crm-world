'use client'

import * as React from 'react'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { useOrganizationScopeVersion } from '@open-mercato/shared/lib/frontend/useOrganizationScope'
import { useT } from '@open-mercato/shared/lib/i18n/context'

type MatchRow = {
  id: string
  contact_id: string
  property_id: string
  score: number
  criteria_matched: Record<string, boolean> | null
  is_dismissed: boolean
  created_at: string
}

type ResponsePayload = {
  items: MatchRow[]
  total: number
  page: number
  totalPages: number
}

export default function MatchingPage() {
  const t = useT()
  const [rows, setRows] = React.useState<MatchRow[]>([])
  const [page, setPage] = React.useState(1)
  const [total, setTotal] = React.useState(0)
  const [totalPages, setTotalPages] = React.useState(1)
  const [isLoading, setIsLoading] = React.useState(true)
  const scopeVersion = useOrganizationScopeVersion()

  React.useEffect(() => {
    let cancelled = false
    async function load() {
      setIsLoading(true)
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('pageSize', '50')
      params.set('is_dismissed', 'false')

      const fallback: ResponsePayload = { items: [], total: 0, page, totalPages: 1 }
      const call = await apiCall<ResponsePayload>(
        `/api/matches?${params.toString()}`,
        undefined,
        { fallback },
      )

      if (call.ok && !cancelled) {
        const payload = call.result ?? fallback
        setRows(Array.isArray(payload.items) ? payload.items : [])
        setTotal(payload.total || 0)
        setTotalPages(payload.totalPages || 1)
      }
      if (!cancelled) setIsLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [page, scopeVersion])

  const columns = React.useMemo<ColumnDef<MatchRow>[]>(
    () => [
      {
        accessorKey: 'score',
        header: 'Score',
        cell: ({ row }) => (
          <Badge variant={row.original.score >= 70 ? 'default' : row.original.score >= 40 ? 'secondary' : 'outline'}>
            {row.original.score}%
          </Badge>
        ),
      },
      {
        accessorKey: 'contact_id',
        header: t('matching.list.col.contact', 'Contacto'),
        cell: ({ row }) => row.original.contact_id.slice(0, 8) + '...',
      },
      {
        accessorKey: 'property_id',
        header: t('matching.list.col.property', 'Propiedad'),
        cell: ({ row }) => row.original.property_id.slice(0, 8) + '...',
      },
      {
        accessorKey: 'criteria_matched',
        header: t('matching.list.col.criteria', 'Criterios'),
        cell: ({ row }) => {
          const criteria = row.original.criteria_matched
          if (!criteria) return '—'
          const matched = Object.entries(criteria).filter(([, v]) => v).length
          const total = Object.keys(criteria).length
          return `${matched}/${total}`
        },
      },
      {
        accessorKey: 'created_at',
        header: t('matching.list.col.date', 'Fecha'),
        cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString('es-VE'),
      },
    ],
    [t],
  )

  return (
    <Page>
      <PageBody>
        <DataTable
          title={t('matching.list.title', 'Matching — Contactos × Propiedades')}
          columns={columns}
          data={rows}
          searchPlaceholder={t('matching.list.search_placeholder', 'Buscar...')}
          pagination={{ page, pageSize: 50, total, totalPages, onPageChange: setPage }}
          isLoading={isLoading}
        />
      </PageBody>
    </Page>
  )
}
