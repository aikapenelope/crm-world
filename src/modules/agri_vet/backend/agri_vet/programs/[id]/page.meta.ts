import type { PageMetadata } from '@open-mercato/shared/modules/registry'
export const metadata: PageMetadata = {
  requireAuth: true,
  requireFeatures: ['agri_vet.edit'],
  pageTitle: 'Detalle Programa Vacunación',
  navHidden: true,
}
