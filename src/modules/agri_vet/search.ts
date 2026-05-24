import type {
  SearchModuleConfig,
  SearchBuildContext,
  SearchIndexSource,
  SearchResultPresenter,
} from '@open-mercato/shared/modules/search'

function norm(v: unknown): string | null {
  if (v == null) return null
  const s = String(v).trim()
  return s.length > 0 ? s : null
}

const VAC_STATUS: Record<string, string> = {
  scheduled: 'Programada', applied: 'Aplicada', missed: 'No aplicada', cancelled: 'Cancelada',
}

export const searchConfig: SearchModuleConfig = {
  entities: [
    // =========================================================================
    // agri_vet.medication — Medicaciones buscadas por diagnóstico o medicamento
    // =========================================================================
    {
      entityId: 'agri_vet.medication',
      enabled: true,
      priority: 35,

      fieldPolicy: {
        searchable: ['medication_name', 'active_ingredient', 'diagnosis', 'medication_lot_number'],
        excluded: ['tenant_id', 'organization_id', 'veterinarian_id'],
      },

      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        if (!r.medication_name) return null
        const statusLabel = r.resolved ? 'Resuelto' : 'En tratamiento'
        return {
          text: [
            norm(r.medication_name as string) ?? '',
            norm(r.diagnosis as string) ?? '',
            norm(r.active_ingredient as string) ?? '',
          ].filter(Boolean),
          presenter: {
            title: (norm(r.medication_name as string) as string | undefined) ?? 'Medicamento',
            subtitle: (norm(r.diagnosis as string) as string | undefined) ?? undefined,
            icon: 'pill',
            badge: statusLabel,
          },
          links: [{ href: `/backend/agri-vet/medications/${r.id}`, label: 'Ver tratamiento', kind: 'primary' }],
          checksumSource: { medication_name: r.medication_name, resolved: r.resolved, withdrawal_end_date: r.withdrawal_end_date, updated_at: r.updated_at },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        return {
          title: (norm(r.medication_name as string) as string | undefined) ?? 'Medicamento',
          subtitle: (norm(r.diagnosis as string) as string | undefined) ?? undefined,
          icon: 'pill',
          badge: r.resolved ? 'Resuelto' : 'En tratamiento',
        }
      },

      resolveUrl: async (ctx: SearchBuildContext): Promise<string | null> =>
        `/backend/agri-vet/medications/${ctx.record.id}`,
    },

    // =========================================================================
    // agri_vet.vaccination — Vacunaciones buscadas por nombre de vacuna
    // =========================================================================
    {
      entityId: 'agri_vet.vaccination',
      enabled: true,
      priority: 25,

      fieldPolicy: {
        searchable: ['vaccine_name', 'active_ingredient', 'manufacturer', 'vaccine_lot_number'],
        excluded: ['tenant_id', 'organization_id', 'operator_id'],
      },

      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        if (!r.vaccine_name) return null
        const statusLabel = VAC_STATUS[String(r.status ?? '')] ?? String(r.status ?? '')
        return {
          text: [norm(r.vaccine_name as string) ?? '', norm(r.active_ingredient as string) ?? ''].filter(Boolean),
          presenter: {
            title: (norm(r.vaccine_name as string) as string | undefined) ?? 'Vacuna',
            subtitle: (norm(r.manufacturer as string) as string | undefined) ?? undefined,
            icon: 'syringe',
            badge: statusLabel,
          },
          links: [{ href: `/backend/agri-vet/vaccinations`, label: 'Ver vacunaciones', kind: 'primary' }],
          checksumSource: { vaccine_name: r.vaccine_name, status: r.status, updated_at: r.updated_at },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        const statusLabel = VAC_STATUS[String(r.status ?? '')] ?? String(r.status ?? '')
        return {
          title: (norm(r.vaccine_name as string) as string | undefined) ?? 'Vacuna',
          subtitle: statusLabel,
          icon: 'syringe',
          badge: statusLabel,
        }
      },

      resolveUrl: async (_ctx: SearchBuildContext): Promise<string | null> =>
        `/backend/agri-vet/vaccinations`,
    },
  ],
}

export default searchConfig
export const config = searchConfig
