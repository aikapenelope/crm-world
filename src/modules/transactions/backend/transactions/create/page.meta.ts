import type { PageMetadata } from '@open-mercato/shared/modules/registry'

export const metadata: PageMetadata = {
  title: 'Registrar Cierre',
  requireAuth: true,
  requireFeatures: ['transactions.create'],
}
