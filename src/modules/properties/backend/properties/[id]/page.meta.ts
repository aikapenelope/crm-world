import type { PageMetadata } from '@open-mercato/shared/modules/registry'

export const metadata: PageMetadata = {
  title: 'Editar Propiedad',
  requireAuth: true,
  requireFeatures: ['properties.edit'],
  pageGroup: 'Inmobiliaria',
  pageGroupKey: 'nav.group.realestate',
  navHidden: true,
}