export const metadata = {
  requireAuth: true,
  requireFeatures: ['retail_branches.transfer'],
  pageTitle: 'Nueva Transferencia',
  pageTitleKey: 'retail_branches.transfer.create',
  hideFromNav: true,
  breadcrumb: [
    { label: 'Sucursales', labelKey: 'retail_branches.nav.title', href: '/backend/retail_branches' },
    { label: 'Transferencias', labelKey: 'retail_branches.nav.transfers', href: '/backend/retail_branches/transfers' },
    { label: 'Nueva', labelKey: 'retail_branches.transfer.create' },
  ],
}
