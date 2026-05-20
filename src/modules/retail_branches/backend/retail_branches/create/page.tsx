'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { Button } from '@open-mercato/ui/primitives/button'

export default function CreateBranchPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const [form, setForm] = React.useState({
    name: '',
    code: '',
    branch_type: 'store',
    address_line1: '',
    city: '',
    state: '',
    phone: '',
    email: '',
  })

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.code) return

    setIsSubmitting(true)
    const call = await apiCall('/api/retail-branches/branches', {
      method: 'POST',
      body: JSON.stringify({
        name: form.name,
        code: form.code.toUpperCase(),
        branch_type: form.branch_type,
        address_line1: form.address_line1 || null,
        city: form.city || null,
        state: form.state || null,
        phone: form.phone || null,
        email: form.email || null,
      }),
    })

    if (call.ok) {
      flash('Sucursal creada exitosamente', 'success')
      router.push('/backend/retail_branches')
    } else {
      flash('Error al crear la sucursal', 'error')
    }
    setIsSubmitting(false)
  }

  return (
    <Page>
      <PageBody>
        <h1 className="text-2xl font-bold mb-6">Nueva Sucursal</h1>

        <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="Tienda Centro"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Código *</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => updateField('code', e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm font-mono uppercase"
                placeholder="CENTRO"
                maxLength={20}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tipo</label>
            <select
              value={form.branch_type}
              onChange={(e) => updateField('branch_type', e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="store">Tienda</option>
              <option value="warehouse">Bodega</option>
              <option value="kiosk">Kiosco</option>
              <option value="popup">Pop-up</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Dirección</label>
            <input
              type="text"
              value={form.address_line1}
              onChange={(e) => updateField('address_line1', e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Av. Principal, Local 5"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Ciudad</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => updateField('city', e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="Caracas"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Estado</label>
              <input
                type="text"
                value={form.state}
                onChange={(e) => updateField('state', e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="Distrito Capital"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Teléfono</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="+58 412-000-0000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="tienda@empresa.com"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creando...' : 'Crear Sucursal'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
          </div>
        </form>
      </PageBody>
    </Page>
  )
}
