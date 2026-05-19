import type { PageMetadata } from '@open-mercato/shared/modules/registry'

export const metadata: PageMetadata = {
  title: 'Propiedades',
  group: 'Real Estate',
  icon: 'building-2',
  order: 10,
  requireAuth: true,
  requireFeatures: ['properties.view'],
}
