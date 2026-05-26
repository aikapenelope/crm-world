'use client'

import * as React from 'react'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { CrudForm, type CrudFormGroup } from '@open-mercato/ui/backend/CrudForm'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { useOrganizationScopeDetail } from '@open-mercato/shared/lib/frontend/useOrganizationScope'
import { useT } from '@open-mercato/shared/lib/i18n/context'

/**
 * Settings page for Real Estate module.
 * Stores social account URLs and branding configuration.
 * Data is saved as tenant-level config via the configs API.
 */
export default function SettingsPage() {
  const t = useT()
  const { organizationId, tenantId } = useOrganizationScopeDetail()
  const [settings, setSettings] = React.useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      try {
        const call = await apiCall<{ value: Record<string, string> }>(
          '/api/configs?key=re_settings',
          undefined,
          { fallback: { value: {} } },
        )
        if (call.ok && call.result?.value) {
          setSettings(call.result.value)
        }
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const groups: CrudFormGroup[] = [
    {
      id: 'social',
      column: 1,
      title: 'Cuentas de redes sociales',
      fields: [
        { id: 'instagram_url', type: 'text', label: 'Instagram', placeholder: 'https://instagram.com/tu_cuenta', defaultValue: settings.instagram_url },
        { id: 'facebook_url', type: 'text', label: 'Facebook', placeholder: 'https://facebook.com/tu_pagina', defaultValue: settings.facebook_url },
        { id: 'tiktok_url', type: 'text', label: 'TikTok', placeholder: 'https://tiktok.com/@tu_cuenta', defaultValue: settings.tiktok_url },
        { id: 'whatsapp_number', type: 'text', label: 'WhatsApp', placeholder: '+58 412 1234567', defaultValue: settings.whatsapp_number },
        { id: 'website_url', type: 'text', label: 'Sitio web', placeholder: 'https://tu-sitio.com', defaultValue: settings.website_url },
      ],
    },
    {
      id: 'branding',
      column: 2,
      title: 'Branding',
      fields: [
        { id: 'company_name', type: 'text', label: 'Nombre de la empresa', placeholder: 'Mi Inmobiliaria', defaultValue: settings.company_name },
        { id: 'agent_name', type: 'text', label: 'Nombre del agente', placeholder: 'Juan Pérez', defaultValue: settings.agent_name },
        { id: 'agent_phone', type: 'text', label: 'Teléfono del agente', placeholder: '+58 412 1234567', defaultValue: settings.agent_phone },
        { id: 'agent_email', type: 'text', label: 'Email del agente', placeholder: 'agente@empresa.com', defaultValue: settings.agent_email },
        { id: 'slogan', type: 'text', label: 'Slogan', placeholder: 'Tu hogar ideal te espera', defaultValue: settings.slogan },
      ],
    },
  ]

  if (isLoading) {
    return (
      <Page>
        <PageBody>
          <p>{t('properties.settings.loading', 'Cargando configuración...')}</p>
        </PageBody>
      </Page>
    )
  }

  return (
    <Page>
      <PageBody>
        <CrudForm
          title={t('properties.settings.title', 'Configuración de Real Estate')}
          backHref="/backend/properties"
          fields={[]}
          groups={groups}
          submitLabel={t('properties.settings.submit', 'Guardar configuración')}
          cancelHref="/backend/properties"
          onSubmit={async (values) => {
            const payload: Record<string, string> = {}
            for (const [key, val] of Object.entries(values)) {
              if (val !== undefined && val !== null && String(val).trim()) {
                payload[key] = String(val).trim()
              }
            }

            await apiCall('/api/configs', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                key: 're_settings',
                value: payload,
                organizationId,
                tenantId,
              }),
            })

            flash(t('properties.settings.success', 'Configuración guardada'), 'success')
          }}
        />
      </PageBody>
    </Page>
  )
}
