import type { PageMetadata } from '@open-mercato/shared/modules/registry'

export const metadata: PageMetadata = {
  requireAuth: true,
  requireFeatures: ['isp_network.manage'],
  pageTitle: 'Nuevo Nodo',
  hidden: true,
}
