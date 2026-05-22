import React from 'react'
import type { PageMetadata } from '@open-mercato/shared/modules/registry'

const icon = React.createElement(
  'svg',
  { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
  React.createElement('line', { x1: 12, y1: 1, x2: 12, y2: 23 }),
  React.createElement('path', { d: 'M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' }),
)

export const metadata: PageMetadata = {
  requireAuth: true,
  requireFeatures: ['isp_sales.view_commissions'],
  pageTitle: 'Comisiones',
  pageTitleKey: 'isp_sales.nav.commissions',
  pageGroup: 'ISP',
  pageGroupKey: 'nav.group.isp',
  pageOrder: 80,
  icon,
}
