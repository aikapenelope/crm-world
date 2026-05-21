import type { ModuleInfo } from '@open-mercato/shared/modules/registry'

export const metadata: ModuleInfo = {
  name: 'isp_billing',
  title: 'Facturación ISP',
  version: '0.1.0',
  description: 'Facturación recurrente mensual: ciclos, facturas, cobros en multi-moneda, IVA 16%, IGTF 3%, y worker de detección de morosos.',
}
export default metadata
