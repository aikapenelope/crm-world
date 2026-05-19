import type { PageMetadata } from '@open-mercato/shared/modules/registry'

export const metadata: PageMetadata = {
  title: 'Datos de Mercado',
  group: 'Real Estate',
  icon: 'bar-chart-3',
  order: 40,
  requireAuth: true,
  requireFeatures: ['properties.view'],
}
