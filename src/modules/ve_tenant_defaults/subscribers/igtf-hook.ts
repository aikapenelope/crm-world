/**
 * IGTF Auto-calculation subscriber.
 *
 * Hooks into `sales.tax.calculate.before` to apply the 3% IGTF
 * (Impuesto a las Grandes Transacciones Financieras) when a payment
 * is made in foreign currency (USD, EUR, USDT) or crypto.
 *
 * This follows the documented extension pattern in:
 * apps/docs/docs/framework/pricing-tax-overrides.mdx
 *
 * IGTF applies on the TOTAL payment amount (including IVA) when
 * paid in any currency other than VES.
 */
export const metadata = {
  event: 'bootstrap',
  persistent: false,
  id: 've_tenant_defaults.igtf-hook',
}

// Currencies that trigger IGTF
const IGTF_CURRENCIES = new Set(['USD', 'EUR', 'USDT', 'BTC', 'ETH'])
const IGTF_RATE = 3 // 3%

export default async function register(_: any, ctx: any) {
  const eventBus = ctx.resolve?.('eventBus')
  if (!eventBus) return

  eventBus.on('sales.tax.calculate.before', (event: any) => {
    const { input, setInput } = event

    // Only apply IGTF if the payment context indicates foreign currency
    // The payment currency is passed via metadata or can be checked
    // against the tenant's fiscal config
    if (input?.metadata?.paymentCurrency && IGTF_CURRENCIES.has(input.metadata.paymentCurrency)) {
      // If no tax rate is set yet, apply IGTF
      if (!input.taxRateId && !input.taxRate) {
        setInput({ taxRate: IGTF_RATE })
      }
    }
  })

  console.log('[ve_tenant_defaults] IGTF event hook registered')
}
