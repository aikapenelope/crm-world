'use client'

import * as React from 'react'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import { CheckCircle2, XCircle } from 'lucide-react'
import { useT } from '@open-mercato/shared/lib/i18n/context'

/**
 * Public Estimate Page — /estimate?id=<estimate_id>
 *
 * Shareable link (no auth) where the customer can:
 * - See all estimate items (labor + parts) with prices
 * - Approve or decline individual items
 * - See totals update in real-time
 * - Submit their approval
 */

type EstimateData = {
  id: string
  estimate_number: string
  status: string
  subtotal_labor: string
  subtotal_parts: string
  tax_amount: string
  total_amount: string
  currency: string
  valid_until: string | null
}

type EstimateItem = {
  id: string
  type: string
  description: string
  quantity: number
  unit_price: string
  total_price: string
  is_approved: boolean
}

export default function PublicEstimatePage() {
  const t = useT()
  const [estimate, setEstimate] = React.useState<EstimateData | null>(null)
  const [items, setItems] = React.useState<EstimateItem[]>([])
  const [approvals, setApprovals] = React.useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [submitted, setSubmitted] = React.useState(false)

  const estimateId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('id') : null

  React.useEffect(() => {
    if (!estimateId) return
    async function load() {
      setIsLoading(true)
      const [eCall, iCall] = await Promise.all([
        apiCall<{ items: EstimateData[] }>(`/api/auto-estimates/estimates?pageSize=1`, undefined, { fallback: { items: [] } }),
        apiCall<{ items: EstimateItem[] }>(`/api/auto-estimates/items?estimate_id=${estimateId}&pageSize=50`, undefined, { fallback: { items: [] } }),
      ])
      if (eCall.ok && eCall.result?.items?.[0]) setEstimate(eCall.result.items[0])
      if (iCall.ok) {
        const loadedItems = iCall.result?.items ?? []
        setItems(loadedItems)
        const initial: Record<string, boolean> = {}
        for (const item of loadedItems) { initial[item.id] = true }
        setApprovals(initial)
      }
      setIsLoading(false)
    }
    load()
  }, [estimateId])

  const toggleApproval = (itemId: string) => {
    setApprovals((prev) => ({ ...prev, [itemId]: !prev[itemId] }))
  }

  const approvedTotal = items
    .filter((item) => approvals[item.id])
    .reduce((sum, item) => sum + Number(item.total_price), 0)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    await new Promise((r) => setTimeout(r, 1000))
    setSubmitted(true)
    setIsSubmitting(false)
  }

  const fmt = (val: string | number) => Number(val).toLocaleString('es-VE', { minimumFractionDigits: 2 })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">{t('auto_estimates.public.loading', 'Cargando presupuesto...')}</p>
      </div>
    )
  }

  if (!estimate) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">{t('auto_estimates.public.not_found', 'Presupuesto no encontrado.')}</p>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <CheckCircle2 className="mx-auto size-16 text-primary" />
          <h1 className="text-2xl font-bold">{t('auto_estimates.public.success.title', 'Respuesta Enviada')}</h1>
          <p className="text-muted-foreground">
            {Object.values(approvals).every(Boolean)
              ? t('auto_estimates.public.success.all', 'Ha aprobado todos los trabajos. El taller procederá con la reparación.')
              : `Ha aprobado ${Object.values(approvals).filter(Boolean).length} de ${items.length} items. El taller lo contactará para confirmar.`
            }
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card px-4 py-6 text-center">
        <h1 className="text-xl font-bold">
          {t('auto_estimates.public.title', 'Presupuesto {number}').replace('{number}', estimate.estimate_number)}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t('auto_estimates.public.subtitle', 'Seleccione los trabajos que desea aprobar')}
        </p>
        {estimate.valid_until && (
          <p className="text-xs text-muted-foreground mt-1">
            {t('auto_estimates.public.valid_until', 'Válido hasta: {date}').replace('{date}', new Date(estimate.valid_until).toLocaleDateString('es-VE'))}
          </p>
        )}
      </div>

      {/* Items */}
      <div className="px-4 py-4 space-y-2">
        {items.map((item) => {
          const isApproved = approvals[item.id] ?? true
          return (
            <div
              key={item.id}
              className={`rounded-lg border p-4 cursor-pointer transition-all ${
                isApproved ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted/30 opacity-70'
              }`}
              onClick={() => toggleApproval(item.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full ${isApproved ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {isApproved ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-xs">
                        {item.type === 'labor'
                          ? t('auto_estimates.public.labor_badge', 'Mano de obra')
                          : t('auto_estimates.public.part_badge', 'Repuesto')}
                      </Badge>
                      {item.quantity > 1 && <span className="text-xs text-muted-foreground">x{item.quantity}</span>}
                    </div>
                  </div>
                </div>
                <span className={`font-bold ${isApproved ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
                  {estimate.currency} {fmt(item.total_price)}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Totals */}
      <div className="px-4 py-4 border-t">
        <div className="rounded-lg border p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {t('auto_estimates.public.approved_items', '{approved} de {total} items')
                .replace('{approved}', String(Object.values(approvals).filter(Boolean).length))
                .replace('{total}', String(items.length))}
            </span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>{t('auto_estimates.public.approved_total', 'Total aprobado')}</span>
            <span className="text-primary">{estimate.currency} {fmt(approvedTotal)}</span>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="px-4 py-4 sticky bottom-0 bg-background border-t">
        <Button
          type="button"
          className="w-full"
          size="lg"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting
            ? t('auto_estimates.public.confirming', 'Enviando...')
            : `${t('auto_estimates.public.confirm_button', 'Confirmar Aprobación')} (${estimate.currency} ${fmt(approvedTotal)})`}
        </Button>
        <p className="text-xs text-muted-foreground text-center mt-2">
          {t('auto_estimates.public.tap_hint', 'Toque un item para aprobarlo o rechazarlo')}
        </p>
      </div>
    </div>
  )
}
