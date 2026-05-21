import React from 'react'
import type { PageMetadata } from '@open-mercato/shared/modules/registry'

const icon = React.createElement(
  'svg',
  { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
  React.createElement('rect', { x: 2, y: 7, width: 20, height: 14, rx: 2, ry: 2 }),
  React.createElement('path', { d: 'M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16' }),
)

export const metadata: PageMetadata = {
  requireAuth: true,
  requireFeatures: ['isp_network.view'],
  pageTitle: 'Inventario CPE',
  pageTitleKey: 'isp_network.nav.cpe',
  pageGroup: 'ISP',
  pageGroupKey: 'nav.group.isp',
  pageOrder: 25,
  icon,
}
