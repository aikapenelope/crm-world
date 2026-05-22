import React from 'react'
import type { PageMetadata } from '@open-mercato/shared/modules/registry'

const icon = React.createElement(
  'svg',
  { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
  React.createElement('path', { d: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' }),
)

export const metadata: PageMetadata = {
  requireAuth: true,
  requireFeatures: ['isp_support.view'],
  pageTitle: 'Soporte',
  pageTitleKey: 'isp_support.nav.tickets',
  pageGroup: 'ISP',
  pageGroupKey: 'nav.group.isp',
  pageOrder: 50,
  icon,
}
