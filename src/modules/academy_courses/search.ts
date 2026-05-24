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

const MODALITY_LABELS: Record<string, string> = {
  in_person: 'Presencial', online: 'Online', hybrid: 'Híbrida',
}

export const searchConfig: SearchModuleConfig = {
  entities: [
    {
      entityId: 'academy_courses.course',
      enabled: true,
      priority: 25,

      fieldPolicy: {
        searchable: ['name', 'description', 'category', 'level', 'modality'],
        excluded: ['price_usd', 'duration_hours'],
      },

      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        const lines: string[] = []
        if (r.name) lines.push(`Curso: ${r.name}`)
        if (r.category) lines.push(`Categoría: ${r.category}`)
        if (r.level) lines.push(`Nivel: ${r.level}`)
        if (r.modality) lines.push(`Modalidad: ${MODALITY_LABELS[String(r.modality)] ?? String(r.modality)}`)
        if (r.description) lines.push(String(r.description).slice(0, 200))
        if (!lines.length) return null

        const subtitle = [norm(r.category as string), norm(r.level as string), MODALITY_LABELS[String(r.modality ?? '')] ?? null].filter(Boolean).join(' · ')
        return {
          text: lines,
          presenter: {
            title: (norm(r.name as string) as string | undefined) ?? 'Curso',
            subtitle: subtitle || undefined,
            icon: 'book-open',
            badge: (norm(r.level as string) as string | undefined) ?? undefined,
          },
          links: [{ href: `/backend/academy_courses/${r.id}`, label: 'Ver curso', kind: 'primary' }],
          checksumSource: { name: r.name, category: r.category, level: r.level, is_active: r.is_active, updated_at: r.updated_at },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        return {
          title: (norm(r.name as string) as string | undefined) ?? 'Curso',
          subtitle: (norm(r.category as string) as string | undefined) ?? undefined,
          icon: 'book-open',
          badge: (norm(r.level as string) as string | undefined) ?? undefined,
        }
      },

      resolveUrl: async (ctx: SearchBuildContext): Promise<string | null> => {
        const id = ctx.record.id
        return id ? `/backend/academy_courses/${encodeURIComponent(String(id))}` : '/backend/academy_courses'
      },
    },
  ],
}

export default searchConfig
export const config = searchConfig
