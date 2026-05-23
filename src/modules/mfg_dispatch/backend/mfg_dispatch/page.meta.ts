import React from 'react'
import type { PageMetadata } from '@open-mercato/shared/modules/registry'
const icon = React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
  React.createElement('rect', { x: 1, y: 3, width: 15, height: 13 }),
  React.createElement('polygon', { points: '16 8 20 8 23 11 23 16 16 16 16 8' }),
  React.createElement('circle', { cx: 5.5, cy: 18.5, r: 2.5 }),
  React.createElement('circle', { cx: 18.5, cy: 18.5, r: 2.5 }))
export const metadata: PageMetadata = {
  requireAuth: true, requireFeatures: ['mfg_dispatch.view'],
  pageTitle: 'Despacho PT', pageTitleKey: 'mfg_dispatch.nav.title',
  pageGroup: 'Manufactura', pageGroupKey: 'nav.group.mfg', pageOrder: 130, icon,
}
