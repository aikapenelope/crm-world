import type { PageMetadata } from '@open-mercato/shared/modules/registry'
export const metadata: PageMetadata = {
  requireAuth: true,
  requireFeatures: ['mfg_orders.view'],
  pageTitle: 'Detalle Orden de Producción',
  navHidden: true,
}
