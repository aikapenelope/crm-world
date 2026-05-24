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

export const searchConfig: SearchModuleConfig = {
  entities: [
    {
      entityId: 'academy_certificates.certificate',
      enabled: true,
      priority: 25,

      fieldPolicy: {
        searchable: ['certificate_number', 'student_name', 'course_name', 'final_grade'],
        excluded: [],
      },


      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        const lines: string[] = []
        if (r.certificate_number) lines.push(String(r.certificate_number))
        if (r.student_name) lines.push(String(r.student_name))
        if (r.course_name) lines.push(String(r.course_name))
        if (r.final_grade) lines.push(String(r.final_grade))
        if (!lines.length) return null
        const presenter: SearchResultPresenter = {
          title: (norm(r.student_name) ?? undefined) ?? 'Student Name',
          subtitle: ((norm(r.course_name) ?? '') + ' · ' + (norm(r.certificate_number) ?? '')).replace(/^\s*·\s*|\s*·\s*$/g, '') || undefined,
          icon: 'award',
          badge: (norm(r.status) ?? undefined) ?? undefined,
        }
        return {
          text: lines,
          presenter,
          links: [{ href: '/backend/academy_certificates/[id]', label: 'Ver certificado', kind: 'primary' }],
          checksumSource: { student_name: r.student_name, updated_at: r.updated_at },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        return {
          title: (norm(r.student_name) ?? undefined) ?? 'Student Name',
          subtitle: (norm(r.course_name) ?? undefined) ?? undefined,
          icon: 'award',
          badge: (norm(r.status) ?? undefined) ?? undefined,
        }
      },

      resolveUrl: async (ctx: SearchBuildContext): Promise<string | null> => {
        const id = ctx.record.id
        return id ? `/backend/academy_certificates/${encodeURIComponent(String(id))}`  : '/backend/academy_certificates/'
      },
    },
  ],
}
export default searchConfig
export const config = searchConfig
