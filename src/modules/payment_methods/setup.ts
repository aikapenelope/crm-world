import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'
import type { EntityManager } from '@mikro-orm/postgresql'
import { PaymentMethodEntity } from './data/entities'

/**
 * Default payment methods for Venezuela.
 * These are seeded on tenant creation and can be customized per tenant.
 */
const DEFAULT_METHODS = [
  {
    code: 'pago_movil',
    name: 'Pago Móvil',
    currency: 'VES',
    requiresReference: true,
    referenceLabel: 'Número de referencia',
    instructions: 'Realizar pago móvil al número indicado y registrar la referencia.',
    icon: 'smartphone',
    isActive: true,
    sortOrder: 1,
  },
  {
    code: 'zelle',
    name: 'Zelle',
    currency: 'USD',
    requiresReference: true,
    referenceLabel: 'Confirmation number',
    instructions: 'Enviar Zelle al email indicado y registrar el número de confirmación.',
    icon: 'dollar-sign',
    isActive: true,
    sortOrder: 2,
  },
  {
    code: 'binance',
    name: 'Binance (USDT)',
    currency: 'USDT',
    requiresReference: true,
    referenceLabel: 'Transaction ID',
    instructions: 'Enviar USDT por Binance Pay o P2P y registrar el ID de transacción.',
    icon: 'bitcoin',
    isActive: true,
    sortOrder: 3,
  },
  {
    code: 'efectivo_usd',
    name: 'Efectivo (USD)',
    currency: 'USD',
    requiresReference: false,
    referenceLabel: null,
    instructions: 'Pago en efectivo en dólares.',
    icon: 'banknote',
    isActive: true,
    sortOrder: 4,
  },
  {
    code: 'efectivo_ves',
    name: 'Efectivo (Bs.)',
    currency: 'VES',
    requiresReference: false,
    referenceLabel: null,
    instructions: 'Pago en efectivo en bolívares.',
    icon: 'banknote',
    isActive: true,
    sortOrder: 5,
  },
  {
    code: 'transferencia',
    name: 'Transferencia Bancaria',
    currency: 'VES',
    requiresReference: true,
    referenceLabel: 'Número de referencia',
    instructions: 'Transferencia bancaria nacional. Registrar número de referencia.',
    icon: 'building-2',
    isActive: true,
    sortOrder: 6,
  },
  {
    code: 'debito',
    name: 'Punto de Venta (Débito)',
    currency: 'VES',
    requiresReference: true,
    referenceLabel: 'Últimos 4 dígitos',
    instructions: 'Pago con tarjeta de débito en punto de venta.',
    icon: 'credit-card',
    isActive: true,
    sortOrder: 7,
  },
]

async function seedPaymentMethods(
  em: EntityManager,
  scope: { tenantId: string; organizationId: string },
): Promise<void> {
  const existing = await em.find(PaymentMethodEntity, {
    tenant_id: scope.tenantId,
    organization_id: scope.organizationId,
  })
  const existingCodes = new Set(existing.map((m) => m.code))

  let touched = false
  for (const method of DEFAULT_METHODS) {
    if (existingCodes.has(method.code)) continue

    const entry = em.create(PaymentMethodEntity, {
      tenant_id: scope.tenantId,
      organization_id: scope.organizationId,
      ...method,
    })
    em.persist(entry)
    touched = true
  }

  if (touched) {
    await em.flush()
    console.log(`[payment_methods] Seeded ${DEFAULT_METHODS.length} payment methods`)
  }
}

export const setup: ModuleSetupConfig = {
  seedDefaults: async (ctx) => {
    const scope = { tenantId: ctx.tenantId, organizationId: ctx.organizationId }
    await seedPaymentMethods(ctx.em, scope)
  },

  defaultRoleFeatures: {
    admin: ['payment_methods.*'],
    employee: ['payment_methods.view', 'payment_methods.record_payment'],
  },
}

export default setup
