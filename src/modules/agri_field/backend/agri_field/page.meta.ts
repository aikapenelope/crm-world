import React from 'react'
import type { PageMetadata } from '@open-mercato/shared/modules/registry'

const icon = React.createElement(
  'svg',
  { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
  React.createElement('path', { d: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' }),
  React.createElement('polyline', { points: '9 22 9 12 15 12 15 22' }),
)

export const metadata: PageMetadata = {
  requireAuth: true,
  requireFeatures: ['agri_field.view'],
  pageTitle: 'Operaciones de Campo',
  pageTitleKey: 'agri_field.nav.title',
  pageGroup: 'Agroindustria',
  pageGroupKey: 'nav.group.agri',
  pageOrder: 80,
  icon,
}
