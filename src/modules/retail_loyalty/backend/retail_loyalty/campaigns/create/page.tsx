'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { Button } from '@open-mercato/ui/primitives/button'

export default function CreateCampaignPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [name, setName] = React.useState('')
  const [type, setType] = React.useState('bonus_points')
  const [targetSegment, setTargetSegment] = React.useState('all')
  const [startsAt, setStartsAt] = React.useState('')
  const [endsAt, setEndsAt] = React.useState('')
  const [bonusPoints, setBonusPoints] = React.useState('50')
  const [multiplier, setMultiplier] = React.useState('2')
  const [discountPercent, setDiscountPercent] = React.useState('10')
  const [messageTemplate, setMessageTemplate] = React.useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !startsAt) return

    const config: Record<string, unknown> = {}
    if (type === 'bonus_points') config.bonus_points = parseInt(bonusPoints)
    if (type === 'points_multiplier') config.multiplier = parseFloat(multiplier)
    if (type === 'discount') config.discount_percent = parseFloat(discountPercent)
    if (type === 'whatsapp_blast') config.message_template = messageTemplate

    setIsSubmitting(true)
    const call = await apiCall('/api/retail-loyalty/campaigns', {
      method: 'POST',
      body: JSON.stringify({
        name, type, target_segment: targetSegment,
        starts_at: startsAt, ends_at: endsAt || null, config,
      }),
    })
    if (call.ok) {
      flash('Campaña creada exitosamente', 'success')
      router.push('/backend/retail_loyalty/campaigns')
    } else {
      flash('Error al crear la campaña', 'error')
    }
    setIsSubmitting(false)
  }

  return (
    <Page>
      <PageBody>
        <h1 className="text-2xl font-bold mb-6">Nueva Campaña</h1>
        <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" placeholder="Promo Navidad 2026" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tipo</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm">
                <option value="bonus_points">Puntos Bonus</option>
                <option value="points_multiplier">Multiplicador de Puntos</option>
                <option value="discount">Descuento</option>
                <option value="whatsapp_blast">WhatsApp Masivo</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Segmento</label>
              <select value={targetSegment} onChange={(e) => setTargetSegment(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm">
                <option value="all">Todos los miembros</option>
                <option value="tier">Por nivel VIP</option>
                <option value="inactive">Inactivos</option>
                <option value="birthday">Cumpleañeros</option>
              </select>
            </div>
          </div>

          {type === 'bonus_points' && (
            <div><label className="block text-sm font-medium mb-1">Puntos Bonus</label>
              <input type="number" value={bonusPoints} onChange={(e) => setBonusPoints(e.target.value)} className="w-40 rounded-md border px-3 py-2 text-sm" min={1} /></div>
          )}
          {type === 'points_multiplier' && (
            <div><label className="block text-sm font-medium mb-1">Multiplicador (ej: 2 = doble puntos)</label>
              <input type="number" value={multiplier} onChange={(e) => setMultiplier(e.target.value)} className="w-40 rounded-md border px-3 py-2 text-sm" step="0.5" min={1} /></div>
          )}
          {type === 'discount' && (
            <div><label className="block text-sm font-medium mb-1">Descuento (%)</label>
              <input type="number" value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} className="w-40 rounded-md border px-3 py-2 text-sm" min={1} max={100} /></div>
          )}
          {type === 'whatsapp_blast' && (
            <div><label className="block text-sm font-medium mb-1">Mensaje WhatsApp</label>
              <textarea value={messageTemplate} onChange={(e) => setMessageTemplate(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" rows={4} placeholder="Hola {nombre}! Tienes {puntos} puntos..." /></div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Inicio *</label>
              <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" required /></div>
            <div><label className="block text-sm font-medium mb-1">Fin (opcional)</label>
              <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" /></div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creando...' : 'Crear Campaña'}</Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
          </div>
        </form>
      </PageBody>
    </Page>
  )
}
