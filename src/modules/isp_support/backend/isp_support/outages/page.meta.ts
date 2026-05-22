import React from 'react'
import type { PageMetadata } from '@open-mercato/shared/modules/registry'

const icon = React.createElement(
  'svg',
  { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
  React.createElement('path', { d: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z' }),
  React.createElement('line', { x1: 12, y1: 9, x2: 12, y2: 13 }),
  React.createElement('line', { x1: 12, y1: 17, x2: 12.01, y2: 17 }),
)

export const metadata: PageMetadata = {
  requireAuth: true,
  requireFeatures: ['isp_support.manage_outages'],
  pageTitle: 'Averías',
  pageTitleKey: 'isp_support.nav.outages',
  pageGroup: 'ISP',
  pageGroupKey: 'nav.group.isp',
  pageOrder: 55,
  icon,
}
