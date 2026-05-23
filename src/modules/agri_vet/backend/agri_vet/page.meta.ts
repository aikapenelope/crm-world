import React from 'react'
import type { PageMetadata } from '@open-mercato/shared/modules/registry'

const icon = React.createElement(
  'svg',
  { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
  React.createElement('path', { d: 'M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v11m0 0a5 5 0 0 0 10 0M9 14H5a2 2 0 0 1-2-2V5m0 0h18' }),
  React.createElement('circle', { cx: 19, cy: 19, r: 3 }),
  React.createElement('path', { d: 'M17 21l-1 1 1-1' }),
)

export const metadata: PageMetadata = {
  requireAuth: true,
  requireFeatures: ['agri_vet.view'],
  pageTitle: 'Sanidad Veterinaria',
  pageTitleKey: 'agri_vet.nav.title',
  pageGroup: 'Agroindustria',
  pageGroupKey: 'nav.group.agri',
  pageOrder: 30,
  icon,
}
