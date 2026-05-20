import type { ModuleInfo } from '@open-mercato/shared/modules/registry'

export const metadata: ModuleInfo = {
  name: 'bank_reconciliation',
  title: 'Conciliación Bancaria',
  version: '0.1.0',
  description: 'Conciliación bancaria mediante carga de extractos CSV y cruce automático con pagos registrados.',
}
