import type { PageMetadata } from '@open-mercato/shared/modules/registry'

export const metadata: PageMetadata = {
  title: 'Propiedades',
  pageGroup: 'Inmobiliaria',
  pageGroupKey: 'nav.group.realestate',
  icon: 'building-2',
  pageOrder: 10,
  requireAuth: true,
  requireFeatures: ['properties.view'],
}
