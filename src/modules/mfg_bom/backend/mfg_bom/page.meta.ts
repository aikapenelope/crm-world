import React from 'react'
import type { PageMetadata } from '@open-mercato/shared/modules/registry'

const icon = React.createElement(
  'svg',
  { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
  React.createElement('rect', { x: 2, y: 3, width: 6, height: 4, rx: 1 }),
  React.createElement('rect', { x: 9, y: 3, width: 13, height: 4, rx: 1 }),
  React.createElement('rect', { x: 2, y: 10, width: 6, height: 4, rx: 1 }),
  React.createElement('rect', { x: 9, y: 10, width: 13, height: 4, rx: 1 }),
  React.createElement('rect', { x: 2, y: 17, width: 6, height: 4, rx: 1 }),
  React.createElement('rect', { x: 9, y: 17, width: 13, height: 4, rx: 1 }),
)

export const metadata: PageMetadata = {
  requireAuth: true,
  requireFeatures: ['mfg_bom.view'],
  pageTitle: 'Bill of Materials',
  pageTitleKey: 'mfg_bom.nav.title',
  pageGroup: 'Manufactura',
  pageGroupKey: 'nav.group.mfg',
  pageOrder: 10,
  icon,
}
