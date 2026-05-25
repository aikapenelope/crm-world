import type { PageMetadata } from '@open-mercato/shared/modules/registry'

export const metadata: PageMetadata = {
  title: 'Cobros',
  requireAuth: true,
  requireFeatures: ['academy_payments.view'],
  pageGroup: 'Academia',
  pageGroupKey: 'nav.group.academy',
  pageOrder: 60,
}
