import type { RateProvider, RateProviderResult } from '@open-mercato/core/modules/currencies/services/providers/base'
import { fetchWithTimeout } from '@open-mercato/shared/lib/http/fetchWithTimeout'

const DEFAULT_TIMEOUT_MS = 15_000

/**
 * BCV / Monitor Dólar provider.
 * Fetches USD/VES and EUR/VES rates from public APIs that track
 * the Venezuelan Central Bank (BCV) official rate.
 */
export class BCVProvider implements RateProvider {
  readonly name = 'BCV (Banco Central de Venezuela)'
  readonly source = 'BCV'
  readonly providerBaseCurrency = 'VES'

  private readonly apiUrl = 'https://pydolarve.org/api/v2/dollar'

  isAvailable(): boolean {
    return true
  }

  async fetchRates(
    date: Date,
    _scope: { tenantId: string; organizationId: string },
    availableCurrencies: Set<string>,
  ): Promise<RateProviderResult[]> {
    if (!availableCurrencies.has('VES')) {
      console.debug('[BCV] Skipping: VES not found in available currencies')
      return []
    }

    try {
      const response = await fetchWithTimeout(this.apiUrl, {
        timeoutMs: DEFAULT_TIMEOUT_MS,
      })

      if (!response.ok) {
        throw new Error(`BCV API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const results: RateProviderResult[] = []

      // pydolarve returns monitors with price field
      const bcvMonitor = data?.monitors?.bcv
      if (bcvMonitor?.price && availableCurrencies.has('USD')) {
        // BCV rate: 1 USD = X VES
        results.push({
          fromCurrencyCode: 'USD',
          toCurrencyCode: 'VES',
          rate: String(bcvMonitor.price),
          source: this.source,
          date,
          type: 'sell',
        })

        // Inverse: 1 VES = 1/X USD
        results.push({
          fromCurrencyCode: 'VES',
          toCurrencyCode: 'USD',
          rate: String(1 / bcvMonitor.price),
          source: this.source,
          date,
          type: 'buy',
        })
      }

      // EUR rate from BCV if available
      const eurMonitor = data?.monitors?.eur
      if (eurMonitor?.price && availableCurrencies.has('EUR')) {
        results.push({
          fromCurrencyCode: 'EUR',
          toCurrencyCode: 'VES',
          rate: String(eurMonitor.price),
          source: this.source,
          date,
          type: 'sell',
        })

        results.push({
          fromCurrencyCode: 'VES',
          toCurrencyCode: 'EUR',
          rate: String(1 / eurMonitor.price),
          source: this.source,
          date,
          type: 'buy',
        })
      }

      console.log(`[BCV] Fetched ${results.length} rates`)
      return results
    } catch (err: any) {
      console.error(`[BCV] Fetch error:`, err.message)
      throw new Error(`Failed to fetch BCV rates: ${err.message}`)
    }
  }
}
