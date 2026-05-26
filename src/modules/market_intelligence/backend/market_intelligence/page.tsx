'use client'

import { useT } from '@open-mercato/shared/lib/i18n/context'

export default function MarketIntelligencePage() {
  const t = useT()

  return (
    <div className="container">
      <h1 className="text-2xl font-semibold mb-4">
        {t('market_intelligence.page.title', 'Tasación')}
      </h1>
      <p className="text-muted-foreground">
        {t('market_intelligence.page.description', 'Analiza el mercado y obtén una valoración basada en datos reales de MercadoLibre.')}
      </p>
    </div>
  )
}
