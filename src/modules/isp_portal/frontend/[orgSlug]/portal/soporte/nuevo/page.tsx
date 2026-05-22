'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { apiCallOrThrow } from '@open-mercato/ui/backend/utils/apiCall'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { Button } from '@open-mercato/ui/primitives/button'
import { ArrowLeft } from 'lucide-react'

type Props = { params: { orgSlug: string } }

export default function IspPortalNuevoTicket({ params }: Props) {
  const { orgSlug } = params
  const router = useRouter()
  const [type, setType] = React.useState('fault')
  const [subject, setSubject] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || submitting) return
    setSubmitting(true)
    try {
      await apiCallOrThrow('/api/isp-portal/tickets', {
        method: 'POST',
        body: JSON.stringify({ type, subject, description: description || null }),
      })
      flash('Ticket creado. Te responderemos a la brevedad.', 'success')
      router.push(`/${orgSlug}/portal/soporte`)
    } catch {
      flash('Error al crear el ticket. Inténtalo de nuevo.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <Button type="button" variant="ghost" size="sm" onClick={() => router.push(`/${orgSlug}/portal/soporte`)}>
          <ArrowLeft className="size-4 mr-1" />
        </Button>
        <h1 className="text-2xl font-bold">Reportar un problema</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">¿Qué tipo de solicitud es?</label>
          <select
            className="w-full border border-input rounded-md px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={type} onChange={(e) => setType(e.target.value)}>
            <option value="fault">No tengo servicio / Velocidad lenta</option>
            <option value="inquiry">Consulta técnica</option>
            <option value="plan_change">Quiero cambiar mi plan</option>
            <option value="complaint">Queja o reclamo</option>
            <option value="other">Otro</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Describe brevemente el problema *</label>
          <input
            type="text" required
            className="w-full border border-input rounded-md px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Ej: Sin internet desde las 8am de hoy"
            value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={255}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Detalles adicionales (opcional)</label>
          <textarea
            className="w-full border border-input rounded-md px-3 py-2 bg-background text-sm min-h-[120px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Describe qué ocurre, desde cuándo, qué has intentado..."
            value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => router.push(`/${orgSlug}/portal/soporte`)}>
            Cancelar
          </Button>
          <Button type="submit" disabled={!subject.trim() || submitting}>
            {submitting ? 'Enviando...' : 'Enviar solicitud'}
          </Button>
        </div>
      </form>
    </div>
  )
}
