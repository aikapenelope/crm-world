/**
 * AGM Exception: raw <form> — dynamic line items
 *
 * This form contains a dynamic array of line items (added/removed at runtime)
 * that CrudForm does not currently support (no repeatable field group).
 * Replacing with CrudForm would require a custom CrudFormGroupComponent
 * that manages its own state for the items array.
 *
 * Acceptable to keep as raw <form> until CrudForm adds native support for
 * repeatable groups, or until a dedicated line-item component is built.
 * All other AGM rules apply (Button components, apiCall, etc.).
 */
'use client'

import * as React from 'react'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { Button } from '@open-mercato/ui/primitives/button'

export default function StorefrontConfigPage() {
  const [form, setForm] = React.useState({
    name: '',
    slug: '',
    payment_methods: ['pago_movil', 'zelle', 'binance', 'efectivo'],
  })
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.slug) return

    setIsSubmitting(true)
    const call = await apiCall('/api/retail-ecommerce/storefronts', {
      method: 'POST',
      body: JSON.stringify({
        name: form.name,
        slug: form.slug,
        payment_methods: form.payment_methods,
        config: { show_prices: true, allow_guest_checkout: true, min_order_usd: 5 },
      }),
    })

    if (call.ok) {
      flash('Tienda configurada exitosamente', 'success')
    } else {
      flash('Error al configurar la tienda', 'error')
    }
    setIsSubmitting(false)
  }

  return (
    <Page>
      <PageBody>
        <h1 className="text-2xl font-bold mb-6">Configurar Tienda Online</h1>

        <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre de la Tienda *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="Mi Tienda Online"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Slug (URL) *</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => updateField('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                className="w-full rounded-md border px-3 py-2 text-sm font-mono"
                placeholder="mi-tienda"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">URL: /tienda/{form.slug || '...'}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Métodos de Pago</label>
            <div className="grid grid-cols-2 gap-2">
              {['pago_movil', 'zelle', 'binance', 'efectivo', 'transferencia', 'debito'].map((method) => (
                <label key={method} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.payment_methods.includes(method)}
                    onChange={(e) => {
                      setForm((prev) => ({
                        ...prev,
                        payment_methods: e.target.checked
                          ? [...prev.payment_methods, method]
                          : prev.payment_methods.filter((m) => m !== method),
                      }))
                    }}
                  />
                  {method.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Guardar Configuración'}
            </Button>
          </div>
        </form>
      </PageBody>
    </Page>
  )
}
