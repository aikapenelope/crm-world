import React from 'react'
import type { PageMetadata } from '@open-mercato/shared/modules/registry'

const icon = React.createElement(
  'svg',
  { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
  React.createElement('rect', { x: 1, y: 4, width: 22, height: 16, rx: 2, ry: 2 }),
  React.createElement('line', { x1: 1, y1: 10, x2: 23, y2: 10 }),
)

export const metadata: PageMetadata = {
  requireAuth: true,
  requireFeatures: ['isp_billing.view'],
  pageTitle: 'Cobros',
  pageTitleKey: 'isp_billing.nav.payments',
  pageGroup: 'ISP',
  pageGroupKey: 'nav.group.isp',
  pageOrder: 45,
  icon,
}
