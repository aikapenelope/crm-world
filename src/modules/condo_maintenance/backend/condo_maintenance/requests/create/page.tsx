'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { CrudForm, type CrudFormGroup } from '@open-mercato/ui/backend/CrudForm'
import { createCrud } from '@open-mercato/ui/backend/utils/crud'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { useOrganizationScopeDetail } from '@open-mercato/shared/lib/frontend/useOrganizationScope'

export default function NuevaSolicitudPage() {
  const router = useRouter()
  const { organizationId, tenantId } = useOrganizationScopeDetail()

  const groups = React.useMemo<CrudFormGroup[]>(() => [
    {
      id: 'main',
      column: 1,
      title: 'Nueva Solicitud',
      fields: [
        { id: 'title', type: 'text', label: 'Título', required: true },
          { id: 'category', type: 'select', label: 'Categoría', required: true, options: [] },
          { id: 'priority', type: 'select', label: 'Prioridad', required: true, options: [] },
          { id: 'description', type: 'textarea', label: 'Descripción', required: true },
          { id: 'requested_by_name', type: 'text', label: 'Solicitado por', required: true },
          { id: 'location', type: 'text', label: 'Ubicación' },
      ],
    },
  ], [])

  return (
    <Page>
      <PageBody>
        <CrudForm
          fields={[]}          title="Nueva Solicitud"
          groups={groups}
          submitLabel="Guardar"
          cancelHref="/backend/condo_maintenance/requests"
          onSubmit={async (values) => {
            await createCrud('condo-maintenance/requests', { ...values, organization_id: organizationId, tenant_id: tenantId }, {
              errorMessage: 'Error al guardar. Verifique los datos e intente nuevamente.',
            })
            flash('Nueva Solicitud creado exitosamente.', 'success')
            router.push('/backend/condo_maintenance/requests')
          }}
        />
      </PageBody>
    </Page>
  )
}
