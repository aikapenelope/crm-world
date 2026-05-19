import type { PageMetadata } from '@open-mercato/shared/modules/registry'

export const metadata: PageMetadata = {
  title: 'Transacciones',
  group: 'Real Estate',
  icon: 'handshake',
  order: 20,
  requireAuth: true,
  requireFeatures: ['transactions.view'],
}
