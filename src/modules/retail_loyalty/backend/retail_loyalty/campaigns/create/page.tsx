'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { CrudForm, type CrudFormGroup } from '@open-mercato/ui/backend/CrudForm'
import { createCrud } from '@open-mercato/ui/backend/utils/crud'
import { flash } from '@open-mercato/ui/backend/FlashMessages'

export default function CreateCampaignPage() {
  const router = useRouter()

  const groups: CrudFormGroup[] = [
    {
      id: 'main',
      title: 'Datos de la campaña',
      fields: [
        { id: 'name', label: 'Nombre', type: 'text', required: true, placeholder: 'Promo Navidad 2026' },
        {
          id: 'type', label: 'Tipo de campaña', type: 'select', defaultValue: 'bonus_points',
          options: [
            { value: 'bonus_points', label: 'Puntos Bonus — otorgar puntos fijos' },
            { value: 'points_multiplier', label: 'Multiplicador — doble o triple puntos' },
            { value: 'discount', label: 'Descuento en compra' },
            { value: 'whatsapp_blast', label: 'WhatsApp Masivo' },
          ],
        },
        {
          id: 'target_segment', label: 'Segmento objetivo', type: 'select', defaultValue: 'all',
          options: [
            { value: 'all', label: 'Todos los miembros' },
            { value: 'tier', label: 'Por nivel VIP' },
            { value: 'inactive', label: 'Inactivos (90+ días sin compra)' },
            { value: 'birthday', label: 'Cumpleañeros del mes' },
          ],
        },
        { id: 'starts_at', label: 'Fecha de inicio', type: 'date', required: true },
        { id: 'ends_at', label: 'Fecha de fin (opcional)', type: 'date' },
      ],
    },
    {
      id: 'config',
      title: 'Configuración de la recompensa (llenar según el tipo)',
      fields: [
        { id: 'bonus_points', label: 'Puntos bonus (tipo: bonus_points)', type: 'number', placeholder: '50' },
        { id: 'multiplier', label: 'Multiplicador (tipo: points_multiplier, ej: 2)', type: 'number', placeholder: '2' },
        { id: 'discount_percent', label: 'Descuento % (tipo: discount)', type: 'number', placeholder: '10' },
        { id: 'message_template', label: 'Plantilla mensaje (tipo: whatsapp_blast)', type: 'textarea', placeholder: 'Hola {nombre}! Tienes {puntos} puntos.' },
      ],
    },
  ]

  return (
    <Page>
      <PageBody>
        <h1 className="text-2xl font-bold mb-6">Nueva Campaña de Fidelización</h1>
        <CrudForm
          fields={[] as any[]}
          groups={groups}
          cancelHref="/backend/retail_loyalty/campaigns"
          onSubmit={async (values) => {
            // Build config from the type-specific values filled in
            const config: Record<string, unknown> = {}
            if (values.bonus_points) config.bonus_points = Number(values.bonus_points)
            if (values.multiplier) config.multiplier = Number(values.multiplier)
            if (values.discount_percent) config.discount_percent = Number(values.discount_percent)
            if (values.message_template) config.message_template = values.message_template

            await createCrud('retail-loyalty/campaigns', {
              name: values.name,
              type: values.type,
              target_segment: values.target_segment,
              starts_at: values.starts_at,
              ends_at: values.ends_at || null,
              config,
            })
            flash('Campaña creada exitosamente', 'success')
            router.push('/backend/retail_loyalty/campaigns')
          }}
        />
      </PageBody>
    </Page>
  )
}
