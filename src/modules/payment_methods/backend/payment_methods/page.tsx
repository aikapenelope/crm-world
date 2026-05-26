'use client'

import { useT } from '@open-mercato/shared/lib/i18n/context'

export default function PaymentMethodsPage() {
  const t = useT()

  return (
    <div className="container">
      <h1 className="text-2xl font-semibold mb-4">
        {t('payment_methods.list.title', 'Métodos de Pago')}
      </h1>
      <p className="text-muted-foreground">
        {t('payment_methods.list.subtitle', 'Gestiona los métodos de pago disponibles para tus clientes.')}
      </p>
    </div>
  )
}
