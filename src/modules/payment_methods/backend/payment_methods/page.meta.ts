import type { PageMetadata } from '@open-mercato/shared/modules/registry'

export const metadata: PageMetadata = {
  title: 'Métodos de Pago',
  group: 'Configuración',
  order: 40,
  requireAuth: true,
  requireFeatures: ['payment_methods.view'],
}
