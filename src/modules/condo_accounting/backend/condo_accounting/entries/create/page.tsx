'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { CrudForm, type CrudFormGroup } from '@open-mercato/ui/backend/CrudForm'
import { createCrud } from '@open-mercato/ui/backend/utils/crud'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { useOrganizationScopeDetail } from '@open-mercato/shared/lib/frontend/useOrganizationScope'

export default function NuevoAsientoPage() {
  const router = useRouter()
  const { organizationId, tenantId } = useOrganizationScopeDetail()

  const groups = React.useMemo<CrudFormGroup[]>(() => [
    {
      id: 'main',
      column: 1,
      title: 'Nuevo Asiento',
      fields: [
        { id: 'entry_date', type: 'date', label: 'Fecha', required: true },
          { id: 'entry_type', type: 'select', label: 'Tipo', required: true, options: [] },
          { id: 'description', type: 'textarea', label: 'Descripción', required: true },
          { id: 'amount', type: 'number', label: 'Monto', required: true },
          { id: 'currency', type: 'text', label: 'Moneda' },
      ],
    },
  ], [])

  return (
    <Page>
      <PageBody>
        <CrudForm
          fields={[]}          title="Nuevo Asiento"
          groups={groups}
          submitLabel="Guardar"
          cancelHref="/backend/condo_accounting/entries"
          onSubmit={async (values) => {
            await createCrud('condo-accounting/entries', { ...values, organization_id: organizationId, tenant_id: tenantId }, {
              errorMessage: 'Error al guardar. Verifique los datos e intente nuevamente.',
            })
            flash('Nuevo Asiento creado exitosamente.', 'success')
            router.push('/backend/condo_accounting/entries')
          }}
        />
      </PageBody>
    </Page>
  )
}
