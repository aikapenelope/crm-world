import type { PageMetadata } from '@open-mercato/shared/modules/registry'

export const metadata: PageMetadata = {
  title: 'Nueva Propiedad',
  requireAuth: true,
  requireFeatures: ['properties.create'],
  pageGroup: 'Inmobiliaria',
  pageGroupKey: 'nav.group.realestate',
}