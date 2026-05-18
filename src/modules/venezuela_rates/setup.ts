import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'
import type { EntityManager } from '@mikro-orm/postgresql'

/**
 * Seeds Venezuelan currencies on tenant creation.
 * USD is the base currency (standard reference in Venezuela).
 * VES, EUR, and USDT are active for exchange operations.
 */

interface CurrencySeed {
  code: string
  name: string
  decimalPlaces: number
  symbol: string
  decimalSeparator: string
  thousandsSeparator: string
  isBase: boolean
  isActive: boolean
}

const VENEZUELA_CURRENCIES: CurrencySeed[] = [
  {
    code: 'USD',
    name: 'Dólar Estadounidense',
    decimalPlaces: 2,
    symbol: '$',
    decimalSeparator: ',',
    thousandsSeparator: '.',
    isBase: true,
    isActive: true,
  },
  {
    code: 'VES',
    name: 'Bolívar',
    decimalPlaces: 2,
    symbol: 'Bs.',
    decimalSeparator: ',',
    thousandsSeparator: '.',
    isBase: false,
    isActive: true,
  },
  {
    code: 'EUR',
    name: 'Euro',
    decimalPlaces: 2,
    symbol: '€',
    decimalSeparator: ',',
    thousandsSeparator: '.',
    isBase: false,
    isActive: true,
  },
  {
    code: 'USDT',
    name: 'Tether (USDT)',
    decimalPlaces: 2,
    symbol: '₮',
    decimalSeparator: ',',
    thousandsSeparator: '.',
    isBase: false,
    isActive: true,
  },
]

async function seedVenezuelaCurrencies(
  em: EntityManager,
  scope: { tenantId: string; organizationId: string },
): Promise<void> {
  // Import Currency entity dynamically to avoid circular deps
  const { Currency } = await import('@open-mercato/core/modules/currencies/data/entities')

  const existing = await em.find(Currency, {
    tenantId: scope.tenantId,
    organizationId: scope.organizationId,
  })
  const existingCodes = new Set(existing.map((c: any) => c.code))

  let touched = false
  for (const curr of VENEZUELA_CURRENCIES) {
    if (existingCodes.has(curr.code)) continue

    const entry = em.create(Currency, {
      tenantId: scope.tenantId,
      organizationId: scope.organizationId,
      ...curr,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    em.persist(entry)
    touched = true
  }

  if (touched) {
    await em.flush()
    console.log(`[venezuela_rates] Seeded ${VENEZUELA_CURRENCIES.length} currencies`)
  }
}

export const setup: ModuleSetupConfig = {
  seedDefaults: async (ctx) => {
    const scope = { tenantId: ctx.tenantId, organizationId: ctx.organizationId }
    await seedVenezuelaCurrencies(ctx.em, scope)
  },
}

export default setup
