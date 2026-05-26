'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { CrudForm, type CrudFormGroup } from '@open-mercato/ui/backend/CrudForm'
import { createCrud } from '@open-mercato/ui/backend/utils/crud'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { useOrganizationScopeDetail } from '@open-mercato/shared/lib/frontend/useOrganizationScope'

export default function NuevaCircularPage() {
  const router = useRouter()
  const { organizationId, tenantId } = useOrganizationScopeDetail()

  const groups = React.useMemo<CrudFormGroup[]>(() => [
    {
      id: 'main',
      column: 1,
      title: 'Nueva Circular',
      fields: [
        { id: 'title', type: 'text', label: 'Título', required: true },
          { id: 'content', type: 'textarea', label: 'Contenido', required: true },
          { id: 'priority', type: 'select', label: 'Prioridad', options: [] },
      ],
    },
  ], [])

  return (
    <Page>
      <PageBody>
        <CrudForm
          title="Nueva Circular"
          groups={groups}
          submitLabel="Guardar"
          cancelHref="/backend/condo_comms/circulars"
          onSubmit={async (values) => {
            await createCrud('condo-comms/circulars', { ...values, organization_id: organizationId, tenant_id: tenantId }, {
              errorMessage: 'Error al guardar. Verifique los datos e intente nuevamente.',
            })
            flash('Nueva Circular creado exitosamente.', 'success')
            router.push('/backend/condo_comms/circulars')
          }}
        />
      </PageBody>
    </Page>
  )
}
