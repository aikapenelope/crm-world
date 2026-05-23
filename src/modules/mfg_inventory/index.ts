import type { ModuleInfo } from '@open-mercato/shared/modules/registry'

export const metadata: ModuleInfo = {
  name: 'mfg_inventory',
  title: 'Almacén Manufactura',
  version: '0.1.0',
  description: 'Almacén de manufactura 4 niveles: MP, empaque, WIP y PT. Lotes FEFO, cuarentena QC, conteo cíclico.',
}
export default metadata
