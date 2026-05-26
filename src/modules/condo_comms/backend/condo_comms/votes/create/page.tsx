'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { CrudForm, type CrudFormGroup } from '@open-mercato/ui/backend/CrudForm'
import { createCrud } from '@open-mercato/ui/backend/utils/crud'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { useOrganizationScopeDetail } from '@open-mercato/shared/lib/frontend/useOrganizationScope'

export default function NuevaVotacionPage() {
  const router = useRouter()
  const { organizationId, tenantId } = useOrganizationScopeDetail()

  const groups = React.useMemo<CrudFormGroup[]>(() => [
    {
      id: 'main',
      column: 1,
      title: 'Nueva Votación',
      fields: [
        { id: 'question', type: 'text', label: 'Pregunta', required: true },
          { id: 'vote_type', type: 'select', label: 'Tipo de votación', required: true, options: [] },
          { id: 'opens_at', type: 'date', label: 'Fecha inicio', required: true },
          { id: 'closes_at', type: 'date', label: 'Fecha cierre', required: true },
      ],
    },
  ], [])

  return (
    <Page>
      <PageBody>
        <CrudForm
          fields={[]}          title="Nueva Votación"
          groups={groups}
          submitLabel="Guardar"
          cancelHref="/backend/condo_comms/votes"
          onSubmit={async (values) => {
            await createCrud('condo-comms/votes', { ...values, organization_id: organizationId, tenant_id: tenantId }, {
              errorMessage: 'Error al guardar. Verifique los datos e intente nuevamente.',
            })
            flash('Nueva Votación creado exitosamente.', 'success')
            router.push('/backend/condo_comms/votes')
          }}
        />
      </PageBody>
    </Page>
  )
}
