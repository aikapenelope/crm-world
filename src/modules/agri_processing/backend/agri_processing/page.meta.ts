import React from 'react'
import type { PageMetadata } from '@open-mercato/shared/modules/registry'

const icon = React.createElement(
  'svg',
  { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
  React.createElement('path', { d: 'M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7-7H4a2 2 0 0 0-2 2z' }),
  React.createElement('path', { d: 'M14 2v6h6' }),
  React.createElement('path', { d: 'M12 18v-6' }),
  React.createElement('path', { d: 'M8 18v-1' }),
  React.createElement('path', { d: 'M16 18v-3' }),
)

export const metadata: PageMetadata = {
  requireAuth: true,
  requireFeatures: ['agri_processing.view'],
  pageTitle: 'Planta de Beneficio',
  pageTitleKey: 'agri_processing.nav.title',
  pageGroup: 'Agroindustria',
  pageGroupKey: 'nav.group.agri',
  pageOrder: 50,
  icon,
}
