'use client'

import * as React from 'react'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import { Spinner } from '@open-mercato/ui/primitives/spinner'
import { MessageCircle, Send, Phone, AlertTriangle, CheckCircle2, Filter } from 'lucide-react'

// =============================================================================
// Types
// =============================================================================

type CobroItem = {
  chargeId: string
  studentId: string
  studentName: string
  gradeLabel: string
  section: string
  representativeName: string
  phone: string | null
  amount: string
  currency: string
  concept: string
  periodMonth: string
  dueDate: string
  status: string
  lateFee: string
  message: string
  waLink: string | null
}

type CobroResponse = {
  items: CobroItem[]
  total: number
  withPhone: number
  withoutPhone: number
}

// =============================================================================
// Main Component
// =============================================================================

export default function CobroWhatsAppPage() {
  const [data, setData] = React.useState<CobroResponse | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [filter, setFilter] = React.useState<'all' | 'overdue' | 'pending'>('overdue')
  const [sendingAll, setSendingAll] = React.useState(false)
  const [sentCount, setSentCount] = React.useState(0)
  const [previewMessage, setPreviewMessage] = React.useState<string | null>(null)

  // Load data
  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const status = filter === 'all' ? 'pending,overdue' : filter
      const call = await apiCall<CobroResponse>(
        `/api/tuition/whatsapp-cobro?status=${status}`,
        undefined,
        { fallback: { items: [], total: 0, withPhone: 0, withoutPhone: 0 } },
      )
      if (call.ok) {
        setData(call.result ?? null)
      }
      setIsLoading(false)
    }
    load()
  }, [filter])

  // Send all sequentially
  const handleSendAll = React.useCallback(async () => {
    if (!data) return
    const itemsWithPhone = data.items.filter((i) => i.waLink)
    if (itemsWithPhone.length === 0) return

    setSendingAll(true)
    setSentCount(0)

    for (let i = 0; i < itemsWithPhone.length; i++) {
      window.open(itemsWithPhone[i].waLink!, '_blank')
      setSentCount(i + 1)
      // Wait 2 seconds between each to avoid browser blocking
      if (i < itemsWithPhone.length - 1) {
        await new Promise((r) => setTimeout(r, 2000))
      }
    }

    setSendingAll(false)
  }, [data])

  if (isLoading) {
    return (
      <Page>
        <PageBody>
          <div className="flex min-h-[300px] items-center justify-center">
            <Spinner />
          </div>
        </PageBody>
      </Page>
    )
  }

  const items = data?.items ?? []
  const withPhone = data?.withPhone ?? 0
  const withoutPhone = data?.withoutPhone ?? 0

  return (
    <Page>
      <PageBody>
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#25D366]/10">
              <MessageCircle className="h-5 w-5 text-[#25D366]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Cobro por WhatsApp</h1>
              <p className="text-sm text-muted-foreground">
                Envía recordatorios de pago directamente por WhatsApp
              </p>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="mb-4 flex items-center gap-4 rounded-lg border bg-muted/30 p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="text-sm font-medium">{items.length} pendientes</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-[#25D366]" />
            <span className="text-sm">{withPhone} con teléfono</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{withoutPhone} sin teléfono</span>
          </div>
          <div className="ml-auto">
            <Button
              type="button"
              className="bg-[#25D366] hover:bg-[#25D366]/90 text-white"
              onClick={handleSendAll}
              disabled={sendingAll || withPhone === 0}
            >
              {sendingAll ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Enviando {sentCount}/{withPhone}...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar todos ({withPhone})
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Button
            type="button"
            variant={filter === 'overdue' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('overdue')}
          >
            Vencidos
          </Button>
          <Button
            type="button"
            variant={filter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('pending')}
          >
            Pendientes
          </Button>
          <Button
            type="button"
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            Todos
          </Button>
        </div>

        {/* Message Preview Modal */}
        {previewMessage && (
          <div className="mb-4 rounded-lg border bg-muted/50 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium uppercase text-muted-foreground">Vista previa del mensaje</span>
              <Button type="button" variant="ghost" size="sm" onClick={() => setPreviewMessage(null)}>
                Cerrar
              </Button>
            </div>
            <pre className="whitespace-pre-wrap text-sm font-sans">{previewMessage}</pre>
          </div>
        )}

        {/* Items List */}
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle2 className="h-12 w-12 text-primary mb-3" />
            <p className="text-lg font-medium">Sin pendientes</p>
            <p className="text-sm text-muted-foreground">No hay cargos {filter === 'overdue' ? 'vencidos' : 'pendientes'} en este momento.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.chargeId}
                className="flex items-center gap-4 rounded-lg border p-4 hover:bg-muted/30 transition-colors"
              >
                {/* Student Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium truncate">{item.studentName}</span>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {item.gradeLabel} - {item.section}
                    </Badge>
                    <Badge
                      variant={item.status === 'overdue' ? 'destructive' : 'secondary'}
                      className="text-xs shrink-0"
                    >
                      {item.status === 'overdue' ? 'Vencido' : 'Pendiente'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{item.representativeName}</span>
                    {item.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {item.phone}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {item.concept} — Vence: {item.dueDate}
                    {Number(item.lateFee) > 0 && (
                      <span className="text-destructive ml-2">+{item.currency} {Number(item.lateFee).toLocaleString('es-VE')} recargo</span>
                    )}
                  </div>
                </div>

                {/* Amount */}
                <div className="text-right shrink-0">
                  <div className="text-lg font-bold">
                    {item.currency} {Number(item.amount).toLocaleString('es-VE')}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreviewMessage(item.message)}
                    title="Ver mensaje"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                  {item.waLink ? (
                    <Button
                      type="button"
                      size="sm"
                      className="bg-[#25D366] hover:bg-[#25D366]/90 text-white"
                      onClick={() => window.open(item.waLink!, '_blank')}
                    >
                      <Send className="mr-1 h-3 w-3" />
                      Enviar
                    </Button>
                  ) : (
                    <Button type="button" size="sm" variant="outline" disabled>
                      Sin teléfono
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </PageBody>
    </Page>
  )
}
