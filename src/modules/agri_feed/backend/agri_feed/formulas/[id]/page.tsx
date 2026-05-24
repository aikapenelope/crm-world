'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Page, PageBody, PageHeader } from '@open-mercato/ui/backend/Page'
import { apiCall, apiCallOrThrow } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@open-mercato/ui/primitives/button'
import { Input } from '@open-mercato/ui/primitives/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@open-mercato/ui/primitives/select'
import { LoadingMessage, ErrorMessage } from '@open-mercato/ui/backend/detail'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react'

type PageState = 'loading' | 'notFound' | 'ready'

type Ingredient = {
  name: string
  category: string
  percentage: string
  price_usd_per_ton: string
  price_ves_per_ton: string
}

const CATEGORY_OPTIONS = [
  { value: 'grain',    label: 'Cereal / Grano (maíz, sorgo, trigo)' },
  { value: 'protein',  label: 'Fuente de proteína (soya, harina carne)' },
  { value: 'mineral',  label: 'Mineral (carbonato Ca, fosfato)' },
  { value: 'additive', label: 'Aditivo (premezcla, lisina, metionina)' },
  { value: 'other',    label: 'Otro' },
]

const CATEGORY_LABEL: Record<string, string> = {
  grain: 'Cereal', protein: 'Proteína', mineral: 'Mineral', additive: 'Aditivo', other: 'Otro',
}

function emptyIngredient(): Ingredient {
  return { name: '', category: 'grain', percentage: '', price_usd_per_ton: '', price_ves_per_ton: '' }
}

/** Re-calculates cost/ton USD from current ingredients + BCV rate */
function calcCostPerTon(ingredients: Ingredient[], bcvRate: number): number {
  let total = 0
  for (const ing of ingredients) {
    const pct = Number(ing.percentage || 0) / 100
    if (pct <= 0) continue
    if (ing.price_usd_per_ton !== '') {
      total += pct * Number(ing.price_usd_per_ton)
    } else if (ing.price_ves_per_ton !== '' && bcvRate > 0) {
      total += pct * (Number(ing.price_ves_per_ton) / bcvRate)
    }
  }
  return total
}

export default function FormulaDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()

  const [state, setState]       = React.useState<PageState>('loading')
  const [formula, setFormula]   = React.useState<any>(null)
  const [ingredients, setIngredients] = React.useState<Ingredient[]>([])
  const [bcvRate, setBcvRate]   = React.useState(0)
  const [saving, setSaving]     = React.useState(false)
  const [hasChanges, setHasChanges] = React.useState(false)

  const load = React.useCallback(async () => {
    setState('loading')
    const [fRes, rateRes] = await Promise.all([
      apiCall<{ items: any[] }>(`/api/agri-feed/formulas?id=${params.id}`),
      apiCall<{ items: any[] }>('/api/venezuela-rates/rates?pageSize=1', undefined, { fallback: { items: [] } }),
    ])
    const f = (fRes.result?.items ?? [])[0] ?? null
    if (!f) { setState('notFound'); return }
    setFormula(f)
    // Parse BCV rate if available
    const rate = (rateRes.result?.items ?? [])[0]
    if (rate) setBcvRate(Number((rate as any).bcv_rate ?? 0))
    // Map stored ingredients to editable rows
    const stored = (f.ingredients ?? []) as any[]
    setIngredients(stored.map((i: any) => ({
      name:              i.name ?? '',
      category:          i.category ?? 'other',
      percentage:        i.percentage != null ? String(i.percentage) : '',
      price_usd_per_ton: i.price_usd_per_ton != null ? String(i.price_usd_per_ton) : '',
      price_ves_per_ton: i.price_ves_per_ton != null ? String(i.price_ves_per_ton) : '',
    })))
    setState('ready')
    setHasChanges(false)
  }, [params.id])

  React.useEffect(() => { load() }, [load])

  const update = (idx: number, field: keyof Ingredient, value: string) => {
    setIngredients((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], [field]: value }
      return next
    })
    setHasChanges(true)
  }

  const addRow = () => { setIngredients((prev) => [...prev, emptyIngredient()]); setHasChanges(true) }
  const removeRow = (idx: number) => { setIngredients((prev) => prev.filter((_, i) => i !== idx)); setHasChanges(true) }

  const totalPct = ingredients.reduce((s, i) => s + Number(i.percentage || 0), 0)
  const computedCost = calcCostPerTon(ingredients, bcvRate)

  const save = async () => {
    if (Math.abs(totalPct - 100) > 0.5) {
      flash(`El total de inclusión es ${totalPct.toFixed(2)}% — debe sumar 100% antes de guardar`, 'warning')
      return
    }
    setSaving(true)
    try {
      const payload = ingredients.map((i) => ({
        name:              i.name,
        category:          i.category,
        percentage:        Number(i.percentage || 0),
        price_usd_per_ton: i.price_usd_per_ton !== '' ? Number(i.price_usd_per_ton) : null,
        price_ves_per_ton: i.price_ves_per_ton !== '' ? Number(i.price_ves_per_ton) : null,
      }))
      await apiCallOrThrow('/api/agri-feed/formulas', {
        method: 'PUT',
        body: JSON.stringify({
          id: params.id,
          ingredients: payload,
          cost_per_ton_usd: computedCost.toFixed(4),
          last_cost_update: new Date().toISOString(),
        }),
      })
      flash('Fórmula guardada — costo recalculado', 'success')
      setHasChanges(false)
      load()
    } catch {
      flash('Error al guardar — intenta de nuevo', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (state === 'loading') return <Page><PageBody><LoadingMessage label="Cargando fórmula..." /></PageBody></Page>
  if (state === 'notFound') return (
    <Page><PageBody>
      <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/agri-feed')} className="mb-4">
        <ArrowLeft className="mr-2 size-4" /> Fórmulas
      </Button>
      <ErrorMessage label="Fórmula no encontrada." />
    </PageBody></Page>
  )

  const pctOk = Math.abs(totalPct - 100) <= 0.5
  const pctColor = pctOk ? 'text-status-success-text' : totalPct > 100 ? 'text-status-error-text' : 'text-status-warning-text'

  return (
    <Page>
      <PageHeader
        title={formula.name}
        description={`${formula.formula_type} · ${formula.species} · ${ingredients.length} ingredientes`}
        actions={
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/agri-feed')}>
              <ArrowLeft className="mr-2 size-4" /> Fórmulas
            </Button>
            {hasChanges && (
              <Button type="button" onClick={save} disabled={saving}>
                <Save className="size-4 mr-2" /> {saving ? 'Guardando...' : 'Guardar fórmula'}
              </Button>
            )}
          </div>
        }
      />
      <PageBody>
        {/* Cost summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-1">Costo/ton calculado</div>
            <div className={`text-2xl font-bold ${computedCost > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
              {computedCost > 0 ? `USD ${computedCost.toFixed(2)}` : '—'}
            </div>
            {bcvRate > 0 && <div className="text-xs text-muted-foreground mt-1">BCV: {bcvRate.toFixed(2)} Bs/USD</div>}
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-1">Costo/ton guardado</div>
            <div className="text-2xl font-bold">
              {formula.cost_per_ton_usd && Number(formula.cost_per_ton_usd) > 0
                ? `USD ${Number(formula.cost_per_ton_usd).toFixed(2)}`
                : '—'}
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-1">Proteína</div>
            <div className="text-2xl font-bold">{formula.protein_pct ? `${formula.protein_pct}%` : '—'}</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-1">Energía</div>
            <div className="text-2xl font-bold">{formula.energy_kcal_kg ? `${formula.energy_kcal_kg} kcal` : '—'}</div>
          </div>
        </div>

        {/* % total indicator */}
        <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${pctOk ? 'bg-status-success-bg text-status-success-text' : 'bg-status-warning-bg text-status-warning-text'}`}>
          Total de inclusión: <span className={`font-bold ${pctColor}`}>{totalPct.toFixed(2)}%</span>
          {pctOk ? ' ✓ Correcto — suma 100%' : ` — debe sumar exactamente 100%`}
        </div>

        {/* Ingredients editor */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Ingredientes</h3>
          <Button type="button" size="sm" onClick={addRow}>
            <Plus className="size-4 mr-2" /> Agregar ingrediente
          </Button>
        </div>

        <div className="space-y-3">
          {ingredients.map((ing, idx) => (
            <div key={idx} className="border border-border rounded-lg p-3 bg-card">
              <div className="grid grid-cols-12 gap-2 items-end">
                {/* Nombre — 3 cols */}
                <div className="col-span-12 md:col-span-3">
                  {idx === 0 && <label className="text-xs font-medium text-muted-foreground block mb-1">Ingrediente</label>}
                  <Input
                    value={ing.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => update(idx, 'name', e.target.value)}
                    placeholder="Maíz amarillo, Harina de soya..."
                  />
                </div>

                {/* Categoría — 2 cols */}
                <div className="col-span-12 md:col-span-2">
                  {idx === 0 && <label className="text-xs font-medium text-muted-foreground block mb-1">Categoría</label>}
                  <Select value={ing.category} onValueChange={(v) => update(idx, 'category', v)}>
                    <SelectTrigger>
                      <SelectValue>{CATEGORY_LABEL[ing.category] ?? ing.category}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* % inclusión — 1 col */}
                <div className="col-span-4 md:col-span-1">
                  {idx === 0 && <label className="text-xs font-medium text-muted-foreground block mb-1">% inclusión</label>}
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={ing.percentage}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => update(idx, 'percentage', e.target.value)}
                    placeholder="65.0"
                  />
                </div>

                {/* Precio USD/ton — 2 cols */}
                <div className="col-span-4 md:col-span-2">
                  {idx === 0 && (
                    <label className="text-xs font-medium text-muted-foreground block mb-1">
                      USD/ton <span className="text-muted-foreground font-normal">(importados)</span>
                    </label>
                  )}
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={ing.price_usd_per_ton}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => update(idx, 'price_usd_per_ton', e.target.value)}
                    placeholder="2500"
                  />
                </div>

                {/* Precio VES/ton — 2 cols */}
                <div className="col-span-4 md:col-span-2">
                  {idx === 0 && (
                    <label className="text-xs font-medium text-muted-foreground block mb-1">
                      Bs/ton <span className="text-muted-foreground font-normal">(nacionales)</span>
                    </label>
                  )}
                  <Input
                    type="number"
                    min="0"
                    value={ing.price_ves_per_ton}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => update(idx, 'price_ves_per_ton', e.target.value)}
                    placeholder="750000"
                  />
                </div>

                {/* Costo parcial calculado — 1 col */}
                <div className="col-span-11 md:col-span-1">
                  {idx === 0 && <label className="text-xs font-medium text-muted-foreground block mb-1">USD/ton parcial</label>}
                  <div className="px-3 py-2 text-sm text-muted-foreground bg-muted/30 rounded-md text-right h-9 flex items-center justify-end">
                    {(() => {
                      const pct = Number(ing.percentage || 0) / 100
                      if (pct <= 0) return '—'
                      if (ing.price_usd_per_ton !== '') return (pct * Number(ing.price_usd_per_ton)).toFixed(2)
                      if (ing.price_ves_per_ton !== '' && bcvRate > 0) return (pct * Number(ing.price_ves_per_ton) / bcvRate).toFixed(2)
                      return '—'
                    })()}
                  </div>
                </div>

                {/* Delete — 1 col */}
                <div className="col-span-1">
                  {idx === 0 && <div className="mb-1 h-4" />}
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive-ghost"
                    onClick={() => removeRow(idx)}
                    aria-label={`Eliminar ${ing.name || 'ingrediente'}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {ingredients.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground border border-dashed border-border rounded-lg">
              Sin ingredientes. Haz clic en "Agregar ingrediente" para comenzar a formular.
            </div>
          )}
        </div>

        {/* Footer totals */}
        {ingredients.length > 0 && (
          <div className="mt-4 p-3 bg-muted/30 rounded-lg flex items-center justify-between text-sm">
            <span className={`font-semibold ${pctColor}`}>
              Total: {totalPct.toFixed(2)}% {pctOk ? '✓' : `(faltan ${(100 - totalPct).toFixed(2)}%)`}
            </span>
            {computedCost > 0 && (
              <span className="font-bold text-primary">
                Costo total: USD {computedCost.toFixed(2)}/ton
                {bcvRate > 0 && (
                  <span className="text-muted-foreground font-normal ml-2">
                    = Bs {(computedCost * bcvRate).toFixed(0)}/ton
                  </span>
                )}
              </span>
            )}
          </div>
        )}

        {hasChanges && (
          <div className="mt-6 flex justify-end">
            <Button type="button" onClick={save} disabled={saving}>
              <Save className="size-4 mr-2" /> {saving ? 'Guardando...' : 'Guardar fórmula'}
            </Button>
          </div>
        )}
      </PageBody>
    </Page>
  )
}
