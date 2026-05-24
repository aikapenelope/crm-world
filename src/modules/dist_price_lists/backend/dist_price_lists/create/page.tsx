'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { CrudForm, type CrudFormGroup } from '@open-mercato/ui/backend/CrudForm'
import { createCrud } from '@open-mercato/ui/backend/utils/crud'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { Tag } from 'lucide-react'

export default function CreatePriceListPage() {
  const router = useRouter()

  const groups = React.useMemo<CrudFormGroup[]>(
    () => [
      {
        id: 'info',
        column: 1,
        title: 'Información de la lista',
        fields: [
          { id: 'name', type: 'text', label: 'Nombre', required: true, placeholder: 'Ej: Mayorista, Detallista, Farmacias' },
          { id: 'code', type: 'text', label: 'Código (slug)', required: true, placeholder: 'mayorista' },
          {
            id: 'type', type: 'select', label: 'Tipo', defaultValue: 'standard',
            options: [
              { label: 'Estándar', value: 'standard' },
              { label: 'Promocional', value: 'promotional' },
              { label: 'Por Volumen', value: 'volume' },
            ],
          },
          {
            id: 'currency', type: 'select', label: 'Moneda', defaultValue: 'USD',
            options: [
              { label: 'USD', value: 'USD' },
              { label: 'EUR', value: 'EUR' },
            ],
          },
          { id: 'is_default', type: 'checkbox', label: 'Lista por defecto (aplica a clientes sin lista asignada)' },
          { id: 'is_active', type: 'checkbox', label: 'Activa', defaultValue: true },
          { id: 'description', type: 'textarea', label: 'Descripción', placeholder: 'Descripción de la lista...' },
        ],
      },
      {
        id: 'validity',
        column: 2,
        title: 'Vigencia (opcional)',
        fields: [
          { id: 'valid_from', type: 'text', label: 'Válida desde', placeholder: 'YYYY-MM-DD (dejar vacío = sin inicio)' },
          { id: 'valid_until', type: 'text', label: 'Válida hasta', placeholder: 'YYYY-MM-DD (dejar vacío = permanente)' },
        ],
      },
    ],
    [],
  )

  return (
    <Page>
      <PageBody>
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Tag className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Nueva Lista de Precios</h1>
            <p className="text-sm text-muted-foreground">Crear una lista de precios para asignar a clientes</p>
          </div>
        </div>

        <CrudForm
          backHref="/backend/dist_price_lists"
          fields={[] as import("@open-mercato/ui/backend/CrudForm").CrudField[]}
          groups={groups}
          submitLabel="Crear Lista"
          cancelHref="/backend/dist_price_lists"
          onSubmit={async (values) => {
            const payload = {
              name: String(values.name).trim(),
              code: String(values.code).trim().toLowerCase(),
              type: String(values.type || 'standard'),
              currency: String(values.currency || 'USD'),
              is_default: Boolean(values.is_default),
              is_active: values.is_active !== false,
              valid_from: values.valid_from ? String(values.valid_from) : null,
              valid_until: values.valid_until ? String(values.valid_until) : null,
              description: values.description ? String(values.description).trim() : null,
            }

            await createCrud('dist-price-lists/lists', payload)
            flash('Lista de precios creada exitosamente', 'success')
            router.push('/backend/dist_price_lists')
          }}
        />
      </PageBody>
    </Page>
  )
}
