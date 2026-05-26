export const metadata = {
  requireAuth: true,
  requireFeatures: ['retail_branches.view'],
  pageTitle: 'Detalle Sucursal',
  pageTitleKey: 'retail_branches.branch.edit',
  navHidden: true,
  breadcrumb: [
    { label: 'Sucursales', labelKey: 'retail_branches.nav.title', href: '/backend/retail_branches' },
    { label: 'Detalle', labelKey: 'retail_branches.branch.edit' },
  ],
}
