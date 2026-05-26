import type { PageMetadata } from '@open-mercato/shared/modules/registry'
import React from 'react'
export const metadata: PageMetadata = {
  title: 'Detalle del RFI',
  requireAuth: true,
  requireFeatures: ['const_rfis.view'],
  pageGroup: 'Construcción',
  pageGroupKey: 'construccion',
  navHidden: true,
}