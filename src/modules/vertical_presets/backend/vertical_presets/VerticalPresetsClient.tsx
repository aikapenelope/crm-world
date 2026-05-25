'use client'

import { useState } from 'react'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { flash } from '@open-mercato/ui/backend/flash'
import { Button } from '@open-mercato/ui/primitives/button'
import { Badge } from '@open-mercato/ui/primitives/badge'
import type { VerticalDefinition } from '../../data/verticals'

type Props = {
  verticals: VerticalDefinition[]
  currentVerticalKey: string | null
}

export default function VerticalPresetsClient({ verticals, currentVerticalKey }: Props) {
  const [selected, setSelected] = useState<string | null>(currentVerticalKey)
  const [saving, setSaving] = useState(false)

  async function handleApply(verticalKey: string) {
    setSaving(true)
    try {
      const call = await apiCall('/api/vertical-presets/tenant-vertical', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ vertical_key: verticalKey }),
      })
      if (!call.ok) {
        flash('No se pudo guardar la vertical', 'error')
        return
      }
      setSelected(verticalKey)
      flash('Vertical asignada correctamente', 'success')
    } catch {
      flash('Error al guardar', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Vertical de Negocio</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Selecciona la vertical que corresponde a este tenant.
          Esto organiza el sidebar y pre-configura los datos de referencia apropiados.
        </p>
      </div>

      {selected && (
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-4 py-3 text-sm">
          <span className="text-muted-foreground">Vertical activa:</span>
          <Badge variant="secondary">
            {verticals.find((v) => v.key === selected)?.label ?? selected}
          </Badge>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {verticals.map((vertical) => {
          const isActive = selected === vertical.key
          return (
            <div
              key={vertical.key}
              className={[
                'flex flex-col gap-3 rounded-lg border p-4 transition-all',
                isActive
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border bg-card hover:border-muted-foreground/40',
              ].join(' ')}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {/* Color dot */}
                  <span
                    className="inline-block size-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: vertical.color }}
                  />
                  <span className="text-sm font-medium text-foreground">{vertical.label}</span>
                </div>
                {isActive && (
                  <Badge className="text-xs" variant="default">Activa</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{vertical.description}</p>
              <p className="text-xs text-muted-foreground/70">
                {vertical.modules.length} módulos
              </p>
              <Button
                size="sm"
                variant={isActive ? 'secondary' : 'outline'}
                disabled={saving || isActive}
                onClick={() => handleApply(vertical.key)}
                className="mt-auto"
              >
                {isActive ? 'Asignada' : 'Seleccionar'}
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
