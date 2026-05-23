import React from 'react'
import type { PageMetadata } from '@open-mercato/shared/modules/registry'
const icon = React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
  React.createElement('polyline', { points: '22 12 18 12 15 21 9 3 6 12 2 12' }))
export const metadata: PageMetadata = {
  requireAuth: true, requireFeatures: ['mfg_mrp.view'],
  pageTitle: 'Motor MRP', pageTitleKey: 'mfg_mrp.nav.title',
  pageGroup: 'Manufactura', pageGroupKey: 'nav.group.mfg', pageOrder: 50, icon,
}
