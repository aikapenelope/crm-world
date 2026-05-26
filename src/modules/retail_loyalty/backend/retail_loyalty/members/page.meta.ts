export const metadata = {
  requireAuth: true,
  requireFeatures: ['retail_loyalty.view'],
  pageTitle: 'Miembros',
  pageTitleKey: 'retail_loyalty.nav.members',
  navHidden: true,
  breadcrumb: [
    { label: 'Fidelización', labelKey: 'retail_loyalty.nav.title', href: '/backend/retail_loyalty' },
    { label: 'Miembros', labelKey: 'retail_loyalty.nav.members' },
  ],
  pageGroup: 'Retail',
  pageGroupKey: 'retail.nav.group',
  pageOrder: 200,
}