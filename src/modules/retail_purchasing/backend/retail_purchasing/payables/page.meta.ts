export const metadata = {
  requireAuth: true,
  requireFeatures: ['retail_purchasing.payables'],
  pageTitle: 'Cuentas por Pagar',
  pageTitleKey: 'retail_purchasing.nav.payables',
  hideFromNav: true,
  breadcrumb: [
    { label: 'Compras', labelKey: 'retail_purchasing.nav.title', href: '/backend/retail_purchasing' },
    { label: 'Cuentas por Pagar', labelKey: 'retail_purchasing.nav.payables' },
  ],
}
