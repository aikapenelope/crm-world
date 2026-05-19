import type { PageMetadata } from '@open-mercato/shared/modules/registry'

export const metadata: PageMetadata = {
  title: 'Configuración',
  group: 'Real Estate',
  icon: 'settings',
  order: 50,
  requireAuth: true,
  requireFeatures: ['properties.edit'],
}
