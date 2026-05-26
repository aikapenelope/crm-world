export const metadata = {
  requireAuth: true,
  requireFeatures: ['retail_purchasing.payables'],
  pageTitle: 'Cuentas por Pagar',
  pageTitleKey: 'retail_purchasing.nav.payables',
  navHidden: true,
  breadcrumb: [
    { label: 'Compras', labelKey: 'retail_purchasing.nav.title', href: '/backend/retail_purchasing' },
    { label: 'Cuentas por Pagar', labelKey: 'retail_purchasing.nav.payables' },
  ],
  pageGroup: 'Retail',
  pageGroupKey: 'retail.nav.group',
  pageOrder: 210,
}