'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { CrudForm, type CrudFormGroup } from '@open-mercato/ui/backend/CrudForm'
import { createCrud } from '@open-mercato/ui/backend/utils/crud'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { Package } from 'lucide-react'

export default function RegisterMovementPage() {
  const router = useRouter()

  const groups = React.useMemo<CrudFormGroup[]>(
    () => [
      {
        id: 'movement',
        column: 1,
        label: 'Datos del movimiento',
        fields: [
          {
            id: 'type', type: 'select', label: 'Tipo de movimiento', required: true,
            options: [
              { label: 'Entrada por compra', value: 'purchase_in' },
              { label: 'Salida por venta', value: 'sale_out' },
              { label: 'Devolución (entrada)', value: 'return_in' },
              { label: 'Ajuste de inventario', value: 'adjustment' },
              { label: 'Transferencia', value: 'transfer' },
              { label: 'Conteo físico', value: 'count' },
            ],
          },
          { id: 'product_id', type: 'text', label: 'ID del Producto', required: true, placeholder: 'UUID del producto (catalog)' },
          { id: 'variant_id', type: 'text', label: 'ID de Variante (opcional)', placeholder: 'UUID de variante' },
          { id: 'quantity', type: 'text', label: 'Cantidad (+ entrada, - salida)', required: true, placeholder: '100' },
          { id: 'warehouse_code', type: 'text', label: 'Bodega', defaultValue: 'main', placeholder: 'main' },
        ],
      },
      {
        id: 'reference',
        column: 2,
        label: 'Referencia y costo',
        fields: [
          {
            id: 'reference_type', type: 'select', label: 'Tipo de referencia', defaultValue: 'manual',
            options: [
              { label: 'Manual', value: 'manual' },
              { label: 'Orden de venta', value: 'sales_order' },
              { label: 'Orden de compra', value: 'purchase_order' },
              { label: 'Devolución', value: 'return' },
            ],
          },
          { id: 'reference_id', type: 'text', label: 'ID de referencia', placeholder: 'UUID del documento (opcional)' },
          { id: 'unit_cost', type: 'text', label: 'Costo unitario', placeholder: '10.50 (para entradas)' },
          { id: 'notes', type: 'textarea', label: 'Notas', placeholder: 'Observaciones del movimiento...' },
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
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Registrar Movimiento</h1>
            <p className="text-sm text-muted-foreground">Entrada, salida o ajuste de inventario</p>
          </div>
        </div>

        <CrudForm
          backHref="/backend/dist_inventory"
          fields={[]}
          groups={groups}
          submitLabel="Registrar Movimiento"
          cancelHref="/backend/dist_inventory"
          onSubmit={async (values) => {
            const payload = {
              product_id: String(values.product_id).trim(),
              variant_id: values.variant_id ? String(values.variant_id).trim() : null,
              warehouse_code: String(values.warehouse_code || 'main'),
              type: String(values.type),
              quantity: Number(values.quantity),
              reference_type: String(values.reference_type || 'manual'),
              reference_id: values.reference_id ? String(values.reference_id).trim() : null,
              unit_cost: values.unit_cost ? String(values.unit_cost) : null,
              notes: values.notes ? String(values.notes).trim() : null,
            }

            await createCrud('dist-inventory/movements', payload)
            flash('Movimiento registrado exitosamente', 'success')
            router.push('/backend/dist_inventory')
          }}
        />
      </PageBody>
    </Page>
  )
}
