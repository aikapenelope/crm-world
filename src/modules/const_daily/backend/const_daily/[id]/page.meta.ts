import type { PageMetadata } from '@open-mercato/shared/modules/registry'
import React from 'react'
export const metadata: PageMetadata = {
  title: 'Reporte Diario de Obra',
  requireAuth: true,
  requireFeatures: ['const_daily.view'],
  pageGroup: 'Construcción',
  pageGroupKey: 'construccion',
  navHidden: true,
}