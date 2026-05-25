import type { PageMetadata } from '@open-mercato/shared/modules/registry'

export const metadata: PageMetadata = {
  title: 'Datos de Mercado',
  pageGroup: 'Inmobiliaria',
  pageGroupKey: 'nav.group.realestate',
  icon: 'bar-chart-3',
  pageOrder: 40,
  requireAuth: true,
  requireFeatures: ['properties.view'],
}
