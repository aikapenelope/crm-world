export const metadata = {
  requireAuth: true,
  requireFeatures: ['retail_loyalty.campaigns'],
  pageTitle: 'Campañas',
  pageTitleKey: 'retail_loyalty.nav.campaigns',
  hideFromNav: true,
  breadcrumb: [
    { label: 'Fidelización', labelKey: 'retail_loyalty.nav.title', href: '/backend/retail_loyalty' },
    { label: 'Campañas', labelKey: 'retail_loyalty.nav.campaigns' },
  ],
}
