import type { PageMetadata } from '@open-mercato/shared/modules/registry'

export const metadata: PageMetadata = {
  title: 'Certificados',
  requireAuth: true,
  requireFeatures: ['academy_certificates.view'],
  pageGroup: 'Academia',
  pageGroupKey: 'nav.group.academy',
  pageOrder: 70,
}
