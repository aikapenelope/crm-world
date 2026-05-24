'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { CrudForm, type CrudFormGroup } from '@open-mercato/ui/backend/CrudForm'
import { createCrud } from '@open-mercato/ui/backend/utils/crud'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { Button } from '@open-mercato/ui/primitives/button'
import { ArrowLeft } from 'lucide-react'

export default function CreateIspPlanPage() {
  const router = useRouter()

  const groups: CrudFormGroup[] = [
    {
      id: 'basic',
      title: 'Información básica',
      fields: [
        { id: 'name', label: 'Nombre del plan', type: 'text', required: true, placeholder: 'Ej: Fibra 100M Plus' },
        {
          id: 'technology', label: 'Tecnología', type: 'select', required: true,
          options: [
            { value: 'wireless', label: 'Inalámbrico (Wireless)' },
            { value: 'fiber', label: 'Fibra óptica (GPON/FTTH)' },
            { value: 'cable', label: 'Cable coaxial (HFC)' },
            { value: 'dedicated', label: 'Enlace dedicado (P2P)' },
          ],
          defaultValue: 'wireless',
        },
        {
          id: 'target_segment', label: 'Segmento objetivo', type: 'select', required: true,
          options: [
            { value: 'residential', label: 'Residencial' },
            { value: 'pyme', label: 'PYME / Empresas pequeñas' },
            { value: 'corporate', label: 'Corporativo' },
            { value: 'wholesale', label: 'Mayorista / Revendedor' },
          ],
          defaultValue: 'residential',
        },
      ],
    },
    {
      id: 'speed',
      title: 'Velocidad',
      fields: [
        { id: 'download_mbps', label: 'Velocidad bajada (Mbps)', type: 'number', required: true },
        { id: 'upload_mbps', label: 'Velocidad subida (Mbps)', type: 'number', required: true },
        { id: 'is_symmetric', label: 'Velocidad simétrica (bajada = subida)', type: 'checkbox', defaultValue: false },
      ],
    },
    {
      id: 'pricing',
      title: 'Precios',
      fields: [
        { id: 'monthly_price_usd', label: 'Precio mensual (USD)', type: 'text', required: true, placeholder: '25.00' },
        { id: 'installation_fee_usd', label: 'Cargo de instalación (USD)', type: 'text', placeholder: '0.00', defaultValue: '0.00' },
      ],
    },
    {
      id: 'network',
      title: 'Configuración de red',
      fields: [
        { id: 'radius_profile', label: 'Perfil Radius', type: 'text', placeholder: 'plan-20mbps' },
        { id: 'olt_profile', label: 'Perfil OLT (GPON)', type: 'text', placeholder: 'gpon-100m' },
      ],
    },
    {
      id: 'settings',
      title: 'Configuración',
      fields: [
        { id: 'is_active', label: 'Plan activo (disponible para venta)', type: 'checkbox', defaultValue: true },
        { id: 'is_promotional', label: 'Promoción temporal', type: 'checkbox', defaultValue: false },
        { id: 'description', label: 'Descripción', type: 'textarea' },
      ],
    },
  ]

  return (
    <Page>
      <PageBody>
        <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/isp-plans')} className="mb-4">
          <ArrowLeft className="mr-2 size-4" /> Planes
        </Button>
        <h1 className="text-2xl font-bold mb-6">Nuevo Plan de Servicio</h1>
        <CrudForm
          fields={[] as import("@open-mercato/ui/backend/CrudForm").CrudField[]}
          groups={groups}
          cancelHref="/backend/isp-plans"
          onSubmit={async (values) => {
            await createCrud('isp-plans/plans', values)
            flash('Plan creado exitosamente', 'success')
            router.push('/backend/isp-plans')
          }}
        />
      </PageBody>
    </Page>
  )
}
