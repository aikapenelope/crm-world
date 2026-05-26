'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { CrudForm, type CrudFormGroup } from '@open-mercato/ui/backend/CrudForm'
import { createCrud } from '@open-mercato/ui/backend/utils/crud'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { useOrganizationScopeDetail } from '@open-mercato/shared/lib/frontend/useOrganizationScope'

export default function NuevaAsambleaPage() {
  const router = useRouter()
  const { organizationId, tenantId } = useOrganizationScopeDetail()

  const groups = React.useMemo<CrudFormGroup[]>(() => [
    {
      id: 'main',
      column: 1,
      title: 'Nueva Asamblea',
      fields: [
        { id: 'title', type: 'text', label: 'Título', required: true },
          { id: 'assembly_date', type: 'date', label: 'Fecha de la asamblea', required: true },
          { id: 'assembly_type', type: 'select', label: 'Tipo', required: true, options: [] },
          { id: 'location', type: 'text', label: 'Lugar' },
          { id: 'agenda', type: 'textarea', label: 'Orden del día', required: true },
      ],
    },
  ], [])

  return (
    <Page>
      <PageBody>
        <CrudForm
          title="Nueva Asamblea"
          groups={groups}
          submitLabel="Guardar"
          cancelHref="/backend/condo_comms"
          onSubmit={async (values) => {
            await createCrud('condo-comms/assemblies', { ...values, organization_id: organizationId, tenant_id: tenantId }, {
              errorMessage: 'Error al guardar. Verifique los datos e intente nuevamente.',
            })
            flash('Nueva Asamblea creado exitosamente.', 'success')
            router.push('/backend/condo_comms')
          }}
        />
      </PageBody>
    </Page>
  )
}
