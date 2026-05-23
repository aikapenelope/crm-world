import React from 'react'
import type { PageMetadata } from '@open-mercato/shared/modules/registry'

const icon = React.createElement(
  'svg',
  { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
  React.createElement('path', { d: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z' }),
  React.createElement('polyline', { points: '3.27 6.96 12 12.01 20.73 6.96' }),
  React.createElement('line', { x1: 12, y1: 22.08, x2: 12, y2: 12 }),
)

export const metadata: PageMetadata = {
  requireAuth: true,
  requireFeatures: ['mfg_inventory.view'],
  pageTitle: 'Almacén Manufactura',
  pageTitleKey: 'mfg_inventory.nav.title',
  pageGroup: 'Manufactura',
  pageGroupKey: 'nav.group.mfg',
  pageOrder: 20,
  icon,
}
