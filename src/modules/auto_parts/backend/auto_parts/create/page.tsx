'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { CrudForm, type CrudFormGroup } from '@open-mercato/ui/backend/CrudForm'
import { createCrud } from '@open-mercato/ui/backend/utils/crud'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { Package } from 'lucide-react'

export default function CreatePartPage() {
  const router = useRouter()

  const groups = React.useMemo<CrudFormGroup[]>(() => [
    {
      id: 'part', column: 1, label: 'Datos del repuesto',
      fields: [
        { id: 'code', type: 'text', label: 'Código', required: true, placeholder: 'FRE-001' },
        { id: 'name', type: 'text', label: 'Nombre', required: true, placeholder: 'Pastillas de freno delanteras' },
        { id: 'brand', type: 'text', label: 'Marca del repuesto', placeholder: 'Brembo, Bosch, etc.' },
        { id: 'category', type: 'select', label: 'Categoría', defaultValue: 'other', options: [
          { label: 'Frenos', value: 'brakes' }, { label: 'Motor', value: 'engine' },
          { label: 'Eléctrico', value: 'electrical' }, { label: 'Suspensión', value: 'suspension' },
          { label: 'Filtros', value: 'filters' }, { label: 'Fluidos', value: 'fluids' },
          { label: 'Carrocería', value: 'body' }, { label: 'Otro', value: 'other' },
        ]},
        { id: 'unit', type: 'text', label: 'Unidad', defaultValue: 'pieza', placeholder: 'pieza, litro, juego' },
        { id: 'location', type: 'text', label: 'Ubicación en taller', placeholder: 'Estante A3' },
      ],
    },
    {
      id: 'pricing', column: 2, label: 'Precios y stock',
      fields: [
        { id: 'cost_price', type: 'text', label: 'Precio de costo', required: true, placeholder: '15.00' },
        { id: 'sell_price', type: 'text', label: 'Precio de venta', required: true, placeholder: '25.00' },
        { id: 'currency', type: 'select', label: 'Moneda', defaultValue: 'USD', options: [{ label: 'USD', value: 'USD' }, { label: 'VES', value: 'VES' }] },
        { id: 'quantity_in_stock', type: 'text', label: 'Cantidad en stock', defaultValue: '0', placeholder: '10' },
        { id: 'reorder_point', type: 'text', label: 'Stock mínimo (alerta)', defaultValue: '0', placeholder: '3' },
      ],
    },
  ], [])

  return (
    <Page>
      <PageBody>
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Agregar Repuesto</h1>
            <p className="text-sm text-muted-foreground">Registrar un repuesto en el inventario del taller</p>
          </div>
        </div>
        <CrudForm
          backHref="/backend/auto_parts" fields={[] as import("@open-mercato/ui/backend/CrudForm").CrudField[]} groups={groups}
          submitLabel="Agregar Repuesto" cancelHref="/backend/auto_parts"
          onSubmit={async (values) => {
            await createCrud('auto-parts/parts', {
              code: String(values.code).trim(), name: String(values.name).trim(),
              brand: values.brand ? String(values.brand).trim() : null,
              category: String(values.category || 'other'), unit: String(values.unit || 'pieza'),
              cost_price: String(values.cost_price), sell_price: String(values.sell_price),
              currency: String(values.currency || 'USD'),
              quantity_in_stock: Number(values.quantity_in_stock) || 0,
              reorder_point: Number(values.reorder_point) || 0,
              location: values.location ? String(values.location).trim() : null,
            })
            flash('Repuesto agregado', 'success')
            router.push('/backend/auto_parts')
          }}
        />
      </PageBody>
    </Page>
  )
}
