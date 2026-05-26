export const metadata = {
  requireAuth: true,
  requireFeatures: ['retail_branches.manage'],
  pageTitle: 'Nueva Sucursal',
  pageTitleKey: 'retail_branches.branch.create',
  navHidden: true,
  breadcrumb: [
    { label: 'Sucursales', labelKey: 'retail_branches.nav.title', href: '/backend/retail_branches' },
    { label: 'Nueva', labelKey: 'retail_branches.branch.create' },
  ],
  pageGroup: 'Retail',
  pageGroupKey: 'retail.nav.group',
}