import React from 'react'
import type { PageMetadata } from '@open-mercato/shared/modules/registry'
const icon = React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
  React.createElement('path', { d: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z' }),
  React.createElement('circle', { cx: 12, cy: 10, r: 3 }))
export const metadata: PageMetadata = {
  requireAuth: true, requireFeatures: ['mfg_procurement.view'],
  pageTitle: 'Compras Industriales', pageTitleKey: 'mfg_procurement.nav.title',
  pageGroup: 'Manufactura', pageGroupKey: 'nav.group.mfg', pageOrder: 100, icon,
}
