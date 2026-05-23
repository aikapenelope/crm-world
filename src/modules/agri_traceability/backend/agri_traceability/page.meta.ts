import React from 'react'
import type { PageMetadata } from '@open-mercato/shared/modules/registry'

const icon = React.createElement(
  'svg',
  { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
  React.createElement('polyline', { points: '22 12 18 12 15 21 9 3 6 12 2 12' }),
)

export const metadata: PageMetadata = {
  requireAuth: true,
  requireFeatures: ['agri_traceability.view'],
  pageTitle: 'Trazabilidad',
  pageTitleKey: 'agri_traceability.nav.title',
  pageGroup: 'Agroindustria',
  pageGroupKey: 'nav.group.agri',
  pageOrder: 65,
  icon,
}
