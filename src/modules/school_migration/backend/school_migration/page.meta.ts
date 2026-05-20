import React from 'react'

const migrationIcon = React.createElement(
  'svg',
  { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
  React.createElement('path', { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' }),
  React.createElement('polyline', { points: '17 8 12 3 7 8' }),
  React.createElement('line', { x1: 12, y1: 3, x2: 12, y2: 15 }),
)

export const metadata = {
  requireAuth: true,
  requireFeatures: ['school_migration.import'],
  pageTitle: 'Migración de Datos',
  pageTitleKey: 'school_migration.nav.title',
  icon: migrationIcon,
  pageGroup: 'Education',
  pageGroupKey: 'education',
  pageOrder: 90,
}
