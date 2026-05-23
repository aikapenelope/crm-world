'use client'

import * as React from 'react'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { FileText, Download } from 'lucide-react'
import { Button } from '@open-mercato/ui/primitives/button'
import { StatusBadge } from '@open-mercato/ui/primitives/status-badge'

type CoaRow = {
  id: string; coa_number: string; lot_number: string
  product_code: string; product_name: string
  production_date: string; expiry_date: string | null
  quantity: string; uom: string; is_released: boolean
  approved_by: string | null; approved_at: string | null
  qa_results: Record<string, string | number | boolean> | null
}

export default function CertificadosPage() {
  const [coas, setCoas]      = React.useState<CoaRow[]>([])
  const [isLoading, setLoad] = React.useState(true)
  const [expanded, setExpanded] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function load() {
      setLoad(true)
      const res = await apiCall<{ items: CoaRow[] }>('/api/mfg-portal/coa', undefined, { fallback: { items: [] } })
      if (res.ok) setCoas(res.result?.items ?? [])
      setLoad(false)
    }
    load()
  }, [])

  if (isLoading) {
    return (
      <div className="p-6 space-y-3">
        {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-muted/30 rounded-xl animate-pulse" />)}
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <FileText className="size-5 text-muted-foreground" />
        <h2 className="font-semibold">Certificados de Análisis</h2>
        <span className="text-xs text-muted-foreground">({coas.length} certificados)</span>
      </div>

      {coas.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <FileText className="size-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No hay certificados de análisis disponibles aún.</p>
          <p className="text-xs mt-1">Los CoA se generan al procesar cada lote de producto terminado.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {coas.map((c) => (
            <div key={c.id} className="border border-border rounded-xl bg-card overflow-hidden">
              <div
                className="p-4 cursor-pointer hover:bg-muted/10 transition-colors"
                onClick={() => setExpanded(expanded === c.id ? null : c.id)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-sm">{c.coa_number}</span>
                      <StatusBadge variant="success">Liberado por QC</StatusBadge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {c.product_code} — {c.product_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Lote: <span className="font-mono">{c.lot_number}</span>
                      {' · '}{c.quantity} {c.uom}
                      {' · '}Producido: {new Date(c.production_date).toLocaleDateString('es-VE')}
                      {c.expiry_date && ` · Vence: ${new Date(c.expiry_date).toLocaleDateString('es-VE')}`}
                    </p>
                  </div>
                  <Button type="button" size="sm" variant="outline" onClick={(e) => { e.stopPropagation() }}>
                    <Download className="size-3 mr-1" /> PDF
                  </Button>
                </div>
              </div>

              {/* Expanded QA results */}
              {expanded === c.id && c.qa_results && (
                <div className="border-t border-border p-4 bg-muted/5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                    Resultados de Análisis
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(c.qa_results).map(([key, val]) => (
                      <div key={key} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                        <span className="font-semibold">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                  {c.approved_by && (
                    <p className="text-xs text-muted-foreground mt-3">
                      Aprobado por: <strong>{c.approved_by}</strong>
                      {c.approved_at && ` el ${new Date(c.approved_at).toLocaleDateString('es-VE')}`}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
