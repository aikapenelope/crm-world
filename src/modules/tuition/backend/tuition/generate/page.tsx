'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@open-mercato/ui/primitives/button'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Spinner } from '@open-mercato/ui/primitives/spinner'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { Calendar, Zap, CheckCircle2, AlertTriangle } from 'lucide-react'

export default function GenerateChargesPage() {
  const router = useRouter()
  const now = new Date()
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const [periodMonth, setPeriodMonth] = React.useState(defaultMonth)
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [result, setResult] = React.useState<{
    generated: number
    skipped: number
    summary: string
  } | null>(null)

  const handleGenerate = async () => {
    setIsGenerating(true)
    setResult(null)

    const call = await apiCall<{ generated: number; skipped: number; summary: string }>(
      '/api/tuition/charges/generate',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period_month: periodMonth }),
      },
      { fallback: { generated: 0, skipped: 0, summary: 'Error' } },
    )

    if (call.ok && call.result) {
      setResult(call.result)
      if (call.result.generated > 0) {
        flash(`Generados ${call.result.generated} cargos para ${periodMonth}`, 'success')
      } else {
        flash('No se generaron cargos nuevos (ya existían o no hay estudiantes activos)', 'info')
      }
    } else {
      flash('Error al generar cargos', 'error')
    }

    setIsGenerating(false)
  }

  // Generate month options (current + next 2 months)
  const monthOptions = React.useMemo(() => {
    const options: { label: string; value: string }[] = []
    for (let i = 0; i < 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleDateString('es-VE', { month: 'long', year: 'numeric' })
      options.push({ label: label.charAt(0).toUpperCase() + label.slice(1), value })
    }
    return options
  }, [])

  return (
    <Page>
      <PageBody>
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Generar Cargos del Mes</h1>
              <p className="text-sm text-muted-foreground">
                Genera automáticamente los cargos de mensualidad para todos los estudiantes activos
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="max-w-lg rounded-lg border p-6 space-y-6">
          {/* Month Selector */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <Calendar className="inline h-4 w-4 mr-1" />
              Mes a generar
            </label>
            <div className="flex gap-2">
              {monthOptions.map((opt) => (
                <Button
                  key={opt.value}
                  type="button"
                  variant={periodMonth === opt.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPeriodMonth(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="rounded-md bg-muted/50 p-4 text-sm space-y-2">
            <p className="font-medium">Al generar se ejecutará:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Buscar todos los estudiantes con estado <Badge variant="outline" className="text-xs">Activo</Badge></li>
              <li>Asignar el plan de mensualidad según su grado</li>
              <li>Aplicar descuentos activos (hermanos, beca, etc.)</li>
              <li>Omitir estudiantes que ya tienen cargo para este mes</li>
            </ul>
          </div>

          {/* Generate Button */}
          <Button
            type="button"
            className="w-full"
            size="lg"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Generando cargos...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Generar Cargos para {monthOptions.find((o) => o.value === periodMonth)?.label ?? periodMonth}
              </>
            )}
          </Button>

          {/* Result */}
          {result && (
            <div className={`rounded-md p-4 ${result.generated > 0 ? 'bg-status-success-bg border border-status-success-border' : 'bg-muted/50 border'}`}>
              <div className="flex items-center gap-2 mb-2">
                {result.generated > 0 ? (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                )}
                <span className="font-medium">{result.summary}</span>
              </div>
              <div className="flex gap-4 text-sm">
                <span>Generados: <strong>{result.generated}</strong></span>
                <span className="text-muted-foreground">Omitidos: {result.skipped}</span>
              </div>
              {result.generated > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => router.push('/backend/tuition')}
                >
                  Ver cargos generados
                </Button>
              )}
            </div>
          )}
        </div>
      </PageBody>
    </Page>
  )
}
