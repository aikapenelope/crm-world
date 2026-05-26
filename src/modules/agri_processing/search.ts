import type {
  SearchModuleConfig, SearchBuildContext, SearchIndexSource, SearchResultPresenter,
} from '@open-mercato/shared/modules/search'

function norm(v: unknown): string | null {
  if (v == null) return null
  const s = String(v).trim()
  return s.length > 0 ? s : null
}

const BATCH_STATUS: Record<string, string> = {
  receiving: 'Recibiendo', processing: 'En proceso', chilling: 'En frío',
  pending_qc: 'Pendiente QC', approved: 'Aprobado', dispatched: 'Despachado',
}
const LOT_STATUS: Record<string, string> = {
  in_stock: 'En stock', partially_dispatched: 'Parcial',
  fully_dispatched: 'Despachado', recalled: 'Recall',
}

export const searchConfig: SearchModuleConfig = {
  entities: [
    {
      entityId: 'agri_processing.agri_slaughter_batch',
      enabled: true, priority: 45,
      fieldPolicy: { searchable: ['batch_number', 'status'], excluded: ['tenant_id', 'organization_id', 'dispatch_approved_by'] },
      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        if (!r.batch_number) return null
        return {
          text: [norm(r.batch_number) ?? ''],
          presenter: { title: (norm(r.batch_number) ?? undefined) ?? 'Beneficio', subtitle: new Date(r.slaughter_date as string).toLocaleDateString(), icon: 'factory', badge: BATCH_STATUS[String(r.status)] ?? String(r.status) },
          links: [{ href: `/backend/agri-processing/${r.id}`, label: 'Ver lote', kind: 'primary' }],
          checksumSource: { batch_number: r.batch_number, status: r.status, updated_at: r.updated_at },
        }
      },
      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        return { title: (norm(r.batch_number) ?? undefined) ?? 'Beneficio', subtitle: BATCH_STATUS[String(r.status)] ?? String(r.status), icon: 'factory', badge: BATCH_STATUS[String(r.status)] ?? String(r.status) }
      },
      resolveUrl: async (ctx: SearchBuildContext): Promise<string | null> => `/backend/agri-processing/${ctx.record.id}`,
    },
    {
      entityId: 'agri_processing.agri_processing_lot',
      enabled: true, priority: 50,
      fieldPolicy: { searchable: ['lot_number', 'barcode', 'status'], excluded: ['tenant_id', 'organization_id'] },
      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        if (!r.lot_number) return null
        return {
          text: [norm(r.lot_number) ?? '', norm(r.barcode) ?? ''].filter(Boolean),
          presenter: { title: (norm(r.lot_number) ?? undefined) ?? 'Producto', subtitle: (norm(r.barcode) ?? undefined) ?? undefined, icon: 'package', badge: LOT_STATUS[String(r.status)] ?? String(r.status) },
          links: [{ href: `/backend/agri-processing/lots/${r.id}`, label: 'Ver lote', kind: 'primary' }],
          checksumSource: { lot_number: r.lot_number, status: r.status, updated_at: r.updated_at },
        }
      },
      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        return { title: (norm(r.lot_number) ?? undefined) ?? 'Producto', icon: 'package', badge: LOT_STATUS[String(r.status)] ?? String(r.status) }
      },
      resolveUrl: async (ctx: SearchBuildContext): Promise<string | null> => `/backend/agri-processing/lots/${ctx.record.id}`,
    },
  ],
}
export default searchConfig
export const config = searchConfig
