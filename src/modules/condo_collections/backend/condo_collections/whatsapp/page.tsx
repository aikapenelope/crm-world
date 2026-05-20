'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@open-mercato/ui/primitives/button'
import { ArrowLeft, ExternalLink } from 'lucide-react'

type WhatsAppMessage = {
  unit_id: string
  owner_name: string
  unit_number: string
  phone: string
  total_debt: string
  periods: string[]
  message: string
  wa_link: string
}

export default function WhatsAppCollectionPage() {
  const router = useRouter()
  const [messages, setMessages] = React.useState<WhatsAppMessage[]>([])
  const [totalDebt, setTotalDebt] = React.useState('0.00')
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const res = await apiCall<{ items: WhatsAppMessage[]; total_debt: string }>(
        '/api/condo-collections/whatsapp',
        undefined,
        { fallback: { items: [], total_debt: '0.00' } },
      )
      if (res.ok && res.result) {
        setMessages(res.result.items ?? [])
        setTotalDebt(res.result.total_debt ?? '0.00')
      }
      setIsLoading(false)
    }
    load()
  }, [])

  return (
    <Page>
      <PageBody>
        <div className="mb-4 flex items-center gap-3">
          <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/condo_collections')}>
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-2xl font-bold">Cobro Masivo por WhatsApp</h1>
        </div>

        <div className="mb-4 rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">
            {messages.length} propietarios con deuda y teléfono registrado.
            Deuda total: <span className="font-bold text-destructive">$ {Number(totalDebt).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
          </p>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay morosos con teléfono registrado.</p>
        ) : (
          <div className="space-y-3">
            {messages.map((m) => (
              <div key={m.unit_id} className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{m.owner_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Unidad {m.unit_number} — {m.phone} — Deuda: $ {Number(m.total_debt).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Períodos: {m.periods.join(', ')}
                    </p>
                  </div>
                  <a href={m.wa_link} target="_blank" rel="noopener noreferrer">
                    <Button type="button" size="sm" className="bg-[#25D366] text-white hover:bg-[#128C7E]">
                      <ExternalLink className="mr-1 size-3" />
                      Enviar
                    </Button>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </PageBody>
    </Page>
  )
}
