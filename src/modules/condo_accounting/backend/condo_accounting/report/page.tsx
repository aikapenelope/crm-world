'use client'

import * as React from 'react'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { EmptyState } from '@open-mercato/ui/backend/EmptyState'
import { FileText } from 'lucide-react'

export default function ReporteContablePage() {
  return (
    <Page>
      <PageBody>
        <EmptyState
          title="Reporte Contable"
          description="Genera reportes de ingresos, egresos y balance del condominio."
          icon={<FileText className="h-8 w-8 text-muted-foreground" />}
        />
      </PageBody>
    </Page>
  )
}
