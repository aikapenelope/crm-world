import type { RateProvider, RateProviderResult } from '@open-mercato/core/modules/currencies/services/providers/base'
import { fetchWithTimeout } from '@open-mercato/shared/lib/http/fetchWithTimeout'

const DEFAULT_TIMEOUT_MS = 15_000

interface DolarApiRate {
  moneda: string
  fuente: 'oficial' | 'paralelo'
  nombre: string
  compra: number | null
  venta: number | null
  promedio: number
  fechaActualizacion: string
}

/**
 * DolarApi.com provider for Venezuela.
 * Single API that provides BCV official rates and parallel/Binance rates
 * for USD/VES and EUR/VES.
 *
 * API docs: https://dolarapi.com/docs/venezuela/
 * Base URL: https://ve.dolarapi.com/v1
 */
export class DolarApiProvider implements RateProvider {
  readonly name = 'DolarApi Venezuela'
  readonly source = 'DOLARAPI'
  readonly providerBaseCurrency = 'VES'

  private readonly baseUrl = 'https://ve.dolarapi.com/v1'

  isAvailable(): boolean {
    return true
  }

  async fetchRates(
    date: Date,
    _scope: { tenantId: string; organizationId: string },
    availableCurrencies: Set<string>,
  ): Promise<RateProviderResult[]> {
    if (!availableCurrencies.has('VES')) {
      console.debug('[DOLARAPI] Skipping: VES not found in available currencies')
      return []
    }

    const results: RateProviderResult[] = []

    // Fetch USD rates (oficial + paralelo)
    if (availableCurrencies.has('USD')) {
      const usdRates = await this.fetchEndpoint('/dolares')
      for (const rate of usdRates) {
        results.push(...this.mapRate(rate, 'USD', date))
      }
    }

    // Fetch EUR rates (oficial + paralelo)
    if (availableCurrencies.has('EUR')) {
      const eurRates = await this.fetchEndpoint('/euros')
      for (const rate of eurRates) {
        results.push(...this.mapRate(rate, 'EUR', date))
      }
    }

    // For USDT: use the parallel dollar rate as reference (Binance P2P based)
    if (availableCurrencies.has('USDT') && availableCurrencies.has('USD')) {
      const usdRates = await this.fetchEndpoint('/dolares')
      const paralelo = usdRates.find((r) => r.fuente === 'paralelo')
      if (paralelo?.promedio) {
        // USDT tracks USD 1:1, but in VES the parallel rate applies
        results.push({
          fromCurrencyCode: 'USDT',
          toCurrencyCode: 'VES',
          rate: String(paralelo.promedio),
          source: `${this.source}_PARALELO`,
          date,
          type: 'sell',
        })
        results.push({
          fromCurrencyCode: 'VES',
          toCurrencyCode: 'USDT',
          rate: String(1 / paralelo.promedio),
          source: `${this.source}_PARALELO`,
          date,
          type: 'buy',
        })
      }
    }

    console.log(`[DOLARAPI] Fetched ${results.length} rates`)
    return results
  }

  private mapRate(rate: DolarApiRate, currencyCode: string, date: Date): RateProviderResult[] {
    const results: RateProviderResult[] = []
    const sourceLabel = rate.fuente === 'oficial'
      ? `${this.source}_BCV`
      : `${this.source}_PARALELO`

    if (rate.promedio && rate.promedio > 0) {
      // Foreign → VES (1 USD/EUR = X VES)
      results.push({
        fromCurrencyCode: currencyCode,
        toCurrencyCode: 'VES',
        rate: String(rate.promedio),
        source: sourceLabel,
        date,
        type: 'sell',
      })

      // VES → Foreign (1 VES = 1/X USD/EUR)
      results.push({
        fromCurrencyCode: 'VES',
        toCurrencyCode: currencyCode,
        rate: String(1 / rate.promedio),
        source: sourceLabel,
        date,
        type: 'buy',
      })
    }

    return results
  }

  private async fetchEndpoint(path: string): Promise<DolarApiRate[]> {
    try {
      const response = await fetchWithTimeout(`${this.baseUrl}${path}`, {
        timeoutMs: DEFAULT_TIMEOUT_MS,
      })

      if (!response.ok) {
        console.error(`[DOLARAPI] Error fetching ${path}: ${response.status}`)
        return []
      }

      return await response.json()
    } catch (err: any) {
      console.error(`[DOLARAPI] Fetch error for ${path}:`, err.message)
      return []
    }
  }
}
