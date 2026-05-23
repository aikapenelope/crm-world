import React from 'react'
import type { PageMetadata } from '@open-mercato/shared/modules/registry'

// Wheat icon — alimento / granos
const icon = React.createElement(
  'svg',
  { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
  React.createElement('path', { d: 'M11 10H9C7 10 5 9 5 7s2-3 4-3h2' }),
  React.createElement('path', { d: 'M12 6v14' }),
  React.createElement('path', { d: 'M13 10h2c2 0 4-1 4-3s-2-3-4-3h-2' }),
  React.createElement('path', { d: 'M9 6H7C5 6 3 5 3 3s2-3 4-3h2' }),
  React.createElement('path', { d: 'M15 6h2c2 0 4-1 4-3s-2-3-4-3h-2' }),
)

export const metadata: PageMetadata = {
  requireAuth: true,
  requireFeatures: ['agri_feed.view'],
  pageTitle: 'Alimento Balanceado',
  pageTitleKey: 'agri_feed.nav.title',
  pageGroup: 'Agroindustria',
  pageGroupKey: 'nav.group.agri',
  pageOrder: 20,
  icon,
}
