import type { PageMetadata } from '@open-mercato/shared/modules/registry'
import React from 'react'

export const metadata: PageMetadata = {
  title: 'Detalle del Recibo',
  requireAuth: true,
  requireFeatures: ['condo_fees.view'],
  pageGroup: 'Condominios',
  pageGroupKey: 'condominios',
  navHidden: true,
}