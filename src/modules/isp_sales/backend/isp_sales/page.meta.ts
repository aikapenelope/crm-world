import React from 'react'
import type { PageMetadata } from '@open-mercato/shared/modules/registry'

const icon = React.createElement(
  'svg',
  { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
  React.createElement('polyline', { points: '22 7 13.5 15.5 8.5 10.5 2 17' }),
  React.createElement('polyline', { points: '16 7 22 7 22 13' }),
)

export const metadata: PageMetadata = {
  requireAuth: true,
  requireFeatures: ['isp_sales.view'],
  pageTitle: 'Ventas / Leads',
  pageTitleKey: 'isp_sales.nav.leads',
  pageGroup: 'ISP',
  pageGroupKey: 'nav.group.isp',
  pageOrder: 70,
  icon,
}
