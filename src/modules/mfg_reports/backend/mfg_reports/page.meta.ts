import React from 'react'
import type { PageMetadata } from '@open-mercato/shared/modules/registry'
const icon = React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
  React.createElement('line', { x1: 18, y1: 20, x2: 18, y2: 10 }),
  React.createElement('line', { x1: 12, y1: 20, x2: 12, y2: 4 }),
  React.createElement('line', { x1: 6, y1: 20, x2: 6, y2: 14 }),
  React.createElement('line', { x1: 2, y1: 20, x2: 22, y2: 20 }))
export const metadata: PageMetadata = {
  requireAuth: true, requireFeatures: ['mfg_reports.view'],
  pageTitle: 'KPIs Manufactura', pageTitleKey: 'mfg_reports.nav.title',
  pageGroup: 'Manufactura', pageGroupKey: 'nav.group.mfg', pageOrder: 150, icon,
}
