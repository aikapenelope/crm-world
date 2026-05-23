/**
 * agri_feed — BCV Rate Change Subscriber
 *
 * Triggered by: venezuela_rates.rate.updated
 *
 * When the BCV exchange rate changes, recalculates the cost_per_ton_usd
 * for all active feed formulas that have ingredients priced in VES.
 *
 * Formula:
 *   cost_per_ton_usd = sum(
 *     ingredient.percentage / 100 *
 *     (ingredient.price_usd_per_ton ?? ingredient.price_ves_per_ton / bcv_rate)
 *   )
 *
 * Cross-module event subscription — uses DI event bus pattern (AGM §9.2).
 */
import { emitLifecycle } from '@app/lib/emit-lifecycle'
import { eventsConfig } from '../events'

export const metadata = {
  event: 'venezuela_rates.rate.updated',
  persistent: true,
  id: 'agri_feed.on-bcv-rate-changed',
}

export default async function handler(payload: any, ctx: any) {
  const em     = ctx.container.resolve('em')
  const kysely = (em as any).getKysely()

  const bcvRate = Number(payload?.bcv_rate ?? payload?.rate ?? 0)
  if (bcvRate <= 0) {
    console.log('[agri_feed.on-bcv-rate-changed] No valid BCV rate in payload — skipping')
    return { skipped: true }
  }

  // Fetch all active formulas that have VES-priced ingredients
  const formulas = await kysely
    .selectFrom('agri_feed_formulas')
    .select(['id', 'tenant_id', 'organization_id', 'name', 'ingredients'])
    .where('is_active', '=', true)
    .where('deleted_at', 'is', null)
    .execute()

  let updated = 0

  for (const formula of formulas as any[]) {
    const ingredients: any[] = formula.ingredients ?? []

    // Check if this formula has any VES-priced ingredients
    const hasVesIngredients = ingredients.some(
      (ing: any) => ing.price_ves_per_ton != null && ing.price_ves_per_ton > 0
    )
    if (!hasVesIngredients) continue

    // Recalculate cost per ton
    let costPerTonUsd = 0
    for (const ing of ingredients) {
      const pct = Number(ing.percentage ?? 0) / 100
      let priceUsdPerTon: number

      if (ing.price_usd_per_ton != null && ing.price_usd_per_ton > 0) {
        priceUsdPerTon = Number(ing.price_usd_per_ton)
      } else if (ing.price_ves_per_ton != null && ing.price_ves_per_ton > 0) {
        priceUsdPerTon = Number(ing.price_ves_per_ton) / bcvRate
      } else {
        continue // ingredient with no price — skip
      }

      costPerTonUsd += pct * priceUsdPerTon
    }

    await kysely
      .updateTable('agri_feed_formulas')
      .set({
        cost_per_ton_usd:  costPerTonUsd.toFixed(4),
        last_bcv_rate:     bcvRate.toFixed(4),
        last_cost_update:  new Date(),
        updated_at:        new Date(),
      })
      .where('id', '=', formula.id)
      .execute()

    await emitLifecycle(
      eventsConfig,
      'agri_feed.formula.cost_updated',
      { tenantId: formula.tenant_id as string, organizationId: formula.organization_id as string },
      { formula_id: formula.id, new_cost_per_ton_usd: costPerTonUsd.toFixed(4), bcv_rate: bcvRate },
    )

    updated++
  }

  console.log(`[agri_feed.on-bcv-rate-changed] Recalculated ${updated} formula(s) at BCV ${bcvRate}`)
  return { updated, bcv_rate: bcvRate }
}
