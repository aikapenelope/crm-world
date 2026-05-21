import React from 'react'
import type { PageMetadata } from '@open-mercato/shared/modules/registry'

const icon = React.createElement(
  'svg',
  { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
  React.createElement('path', { d: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' }),
)

export const metadata: PageMetadata = {
  requireAuth: true,
  requireFeatures: ['isp_plans.view'],
  pageTitle: 'Planes de Servicio',
  pageTitleKey: 'isp_plans.nav.title',
  pageGroup: 'ISP',
  pageGroupKey: 'nav.group.isp',
  pageOrder: 10,
  icon,
}
