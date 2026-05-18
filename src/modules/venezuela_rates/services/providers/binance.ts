import type { RateProvider, RateProviderResult } from '@open-mercato/core/modules/currencies/services/providers/base'
import { fetchWithTimeout } from '@open-mercato/shared/lib/http/fetchWithTimeout'

const DEFAULT_TIMEOUT_MS = 15_000

/**
 * Binance P2P provider.
 * Fetches USDT/VES rate from Binance P2P market data.
 * This represents the crypto-referenced dollar rate used widely in Venezuela.
 */
export class BinanceP2PProvider implements RateProvider {
  readonly name = 'Binance P2P'
  readonly source = 'BINANCE'
  readonly providerBaseCurrency = 'VES'

  private readonly apiUrl = 'https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search'

  isAvailable(): boolean {
    return true
  }

  async fetchRates(
    date: Date,
    _scope: { tenantId: string; organizationId: string },
    availableCurrencies: Set<string>,
  ): Promise<RateProviderResult[]> {
    if (!availableCurrencies.has('VES') || !availableCurrencies.has('USDT')) {
      console.debug('[BINANCE] Skipping: VES or USDT not found in available currencies')
      return []
    }

    try {
      // Fetch USDT/VES buy ads (what people are paying for USDT in VES)
      const buyRate = await this.fetchMedianRate('BUY')
      // Fetch USDT/VES sell ads (what people sell USDT for in VES)
      const sellRate = await this.fetchMedianRate('SELL')

      const results: RateProviderResult[] = []

      if (buyRate) {
        // 1 USDT = X VES (buy side — what you pay in VES to get USDT)
        results.push({
          fromCurrencyCode: 'USDT',
          toCurrencyCode: 'VES',
          rate: String(buyRate),
          source: this.source,
          date,
          type: 'buy',
        })
      }

      if (sellRate) {
        // 1 USDT = X VES (sell side — what you receive in VES for USDT)
        results.push({
          fromCurrencyCode: 'USDT',
          toCurrencyCode: 'VES',
          rate: String(sellRate),
          source: this.source,
          date,
          type: 'sell',
        })

        // Inverse: VES → USDT
        results.push({
          fromCurrencyCode: 'VES',
          toCurrencyCode: 'USDT',
          rate: String(1 / sellRate),
          source: this.source,
          date,
          type: 'buy',
        })
      }

      console.log(`[BINANCE] Fetched ${results.length} rates (buy: ${buyRate}, sell: ${sellRate})`)
      return results
    } catch (err: any) {
      console.error(`[BINANCE] Fetch error:`, err.message)
      throw new Error(`Failed to fetch Binance P2P rates: ${err.message}`)
    }
  }

  /**
   * Fetches the median price from top Binance P2P ads.
   * Uses the first page of ads sorted by price to get a representative rate.
   */
  private async fetchMedianRate(tradeType: 'BUY' | 'SELL'): Promise<number | null> {
    const body = {
      fiat: 'VES',
      page: 1,
      rows: 10,
      tradeType,
      asset: 'USDT',
      countries: [],
      proMerchantAds: false,
      shieldMerchantAds: false,
      publisherType: null,
      payTypes: [],
    }

    const response = await fetchWithTimeout(this.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      timeoutMs: DEFAULT_TIMEOUT_MS,
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    const ads = data?.data ?? []

    if (ads.length === 0) {
      return null
    }

    // Extract prices and compute median
    const prices = ads
      .map((ad: any) => parseFloat(ad.adv?.price))
      .filter((p: number) => !isNaN(p) && p > 0)
      .sort((a: number, b: number) => a - b)

    if (prices.length === 0) {
      return null
    }

    const mid = Math.floor(prices.length / 2)
    return prices.length % 2 === 0
      ? (prices[mid - 1] + prices[mid]) / 2
      : prices[mid]
  }
}
