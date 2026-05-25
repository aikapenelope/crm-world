import type { PageMetadata } from '@open-mercato/shared/modules/registry'

export const metadata: PageMetadata = {
  title: 'Transacciones',
  pageGroup: 'Inmobiliaria',
  pageGroupKey: 'nav.group.realestate',
  icon: 'handshake',
  pageOrder: 20,
  requireAuth: true,
  requireFeatures: ['transactions.view'],
}
