'use client'

import { useT } from '@open-mercato/shared/lib/i18n/context'

export default function MarketDataPage() {
  const t = useT()

  return (
    <div className="container">
      <h1 className="text-2xl font-semibold mb-4">
        {t('mercadolibre_sync.page.title', 'Datos de Mercado')}
      </h1>
      <p className="text-muted-foreground">
        {t('mercadolibre_sync.page.description', 'Listings sincronizados de MercadoLibre Venezuela para análisis de mercado.')}
      </p>
    </div>
  )
}
