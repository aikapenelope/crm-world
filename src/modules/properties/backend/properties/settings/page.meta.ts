import type { PageMetadata } from '@open-mercato/shared/modules/registry'

export const metadata: PageMetadata = {
  title: 'Configuración',
  pageGroup: 'Inmobiliaria',
  pageGroupKey: 'nav.group.realestate',
  icon: 'settings',
  pageOrder: 50,
  requireAuth: true,
  requireFeatures: ['properties.edit'],
}
