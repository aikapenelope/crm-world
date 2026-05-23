import React from 'react'
import type { PageMetadata } from '@open-mercato/shared/modules/registry'

// Wheat/field icon — representa producción agropecuaria
const icon = React.createElement(
  'svg',
  { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
  React.createElement('path', { d: 'M2 22 16 8' }),
  React.createElement('path', { d: 'M3.47 12.53 5 11l1.53 1.53a3.5 3.5 0 0 1 0 4.94L5 19l-1.53-1.53a3.5 3.5 0 0 1 0-4.94z' }),
  React.createElement('path', { d: 'M7.47 8.53 9 7l1.53 1.53a3.5 3.5 0 0 1 0 4.94L9 15l-1.53-1.53a3.5 3.5 0 0 1 0-4.94z' }),
  React.createElement('path', { d: 'M11.47 4.53 13 3l1.53 1.53a3.5 3.5 0 0 1 0 4.94L13 11l-1.53-1.53a3.5 3.5 0 0 1 0-4.94z' }),
  React.createElement('path', { d: 'M20 2h2v2a4 4 0 0 1-4 4h-2V6a4 4 0 0 1 4-4z' }),
  React.createElement('path', { d: 'M11.47 17.47 13 19l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L5 19l1.53-1.53a3.5 3.5 0 0 1 4.94 0z' }),
)

export const metadata: PageMetadata = {
  requireAuth: true,
  requireFeatures: ['agri_units.view'],
  pageTitle: 'Producción Animal',
  pageTitleKey: 'agri_units.nav.title',
  pageGroup: 'Agroindustria',
  pageGroupKey: 'nav.group.agri',
  pageOrder: 10,
  icon,
}
