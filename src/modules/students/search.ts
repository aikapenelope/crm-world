import type {
  SearchModuleConfig,
  SearchBuildContext,
  SearchIndexSource,
  SearchResultPresenter,
  SearchResultLink,
} from '@open-mercato/shared/modules/search'

// =============================================================================
// Helpers
// =============================================================================

const GRADE_LABELS: Record<string, string> = {
  maternal: 'Maternal',
  preescolar_1: 'Preescolar I',
  preescolar_2: 'Preescolar II',
  preescolar_3: 'Preescolar III',
  primaria_1: '1er Grado',
  primaria_2: '2do Grado',
  primaria_3: '3er Grado',
  primaria_4: '4to Grado',
  primaria_5: '5to Grado',
  primaria_6: '6to Grado',
  bachillerato_1: '1er Año',
  bachillerato_2: '2do Año',
  bachillerato_3: '3er Año',
  bachillerato_4: '4to Año',
  bachillerato_5: '5to Año',
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Activo',
  graduated: 'Graduado',
  withdrawn: 'Retirado',
  suspended: 'Suspendido',
  transferred: 'Transferido',
}

// =============================================================================
// Search Module Configuration
// =============================================================================

export const searchConfig: SearchModuleConfig = {
  entities: [
    {
      entityId: 'students:student',
      enabled: true,
      priority: 10,

      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const record = ctx.record
        const lines: string[] = []

        const fullName = `${record.first_name ?? ''} ${record.last_name ?? ''}`.trim()
        if (fullName) lines.push(`Nombre: ${fullName}`)
        if (record.cedula) lines.push(`Cédula: ${record.cedula}`)
        if (record.grade_level) lines.push(`Grado: ${GRADE_LABELS[String(record.grade_level)] ?? record.grade_level}`)
        if (record.section) lines.push(`Sección: ${record.section}`)
        if (record.enrollment_status) lines.push(`Estado: ${STATUS_LABELS[String(record.enrollment_status)] ?? record.enrollment_status}`)

        if (!lines.length) return null

        const subtitleParts: string[] = []
        if (record.grade_level) subtitleParts.push(GRADE_LABELS[String(record.grade_level)] ?? String(record.grade_level))
        if (record.section) subtitleParts.push(`Sección ${record.section}`)

        const presenter: SearchResultPresenter = {
          title: fullName || 'Estudiante',
          subtitle: subtitleParts.length ? subtitleParts.join(' · ') : undefined,
          icon: 'graduation-cap',
          badge: STATUS_LABELS[String(record.enrollment_status)] ?? undefined,
        }

        const links: SearchResultLink[] = []
        if (record.id) {
          links.push({
            href: `/backend/students/${encodeURIComponent(String(record.id))}`,
            label: fullName || 'Ver estudiante',
            kind: 'primary',
          })
        }

        return {
          text: lines,
          presenter,
          links,
          checksumSource: {
            first_name: record.first_name,
            last_name: record.last_name,
            grade_level: record.grade_level,
            section: record.section,
            enrollment_status: record.enrollment_status,
            updated_at: record.updated_at,
          },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const record = ctx.record
        const fullName = `${record.first_name ?? ''} ${record.last_name ?? ''}`.trim()
        const subtitleParts: string[] = []
        if (record.grade_level) subtitleParts.push(GRADE_LABELS[String(record.grade_level)] ?? String(record.grade_level))
        if (record.section) subtitleParts.push(`Sección ${record.section}`)

        return {
          title: fullName || 'Estudiante',
          subtitle: subtitleParts.length ? subtitleParts.join(' · ') : undefined,
          icon: 'graduation-cap',
          badge: STATUS_LABELS[String(record.enrollment_status)] ?? undefined,
        }
      },

      resolveUrl: async (ctx: SearchBuildContext): Promise<string | null> => {
        const id = ctx.record.id
        if (!id) return null
        return `/backend/students/${encodeURIComponent(String(id))}`
      },

      resolveLinks: async (ctx: SearchBuildContext): Promise<SearchResultLink[] | null> => {
        const id = ctx.record.id
        if (!id) return null
        return [
          {
            href: `/backend/students/${encodeURIComponent(String(id))}`,
            label: 'Editar',
            kind: 'secondary',
          },
        ]
      },

      fieldPolicy: {
        searchable: [
          'first_name',
          'last_name',
          'cedula',
          'grade_level',
          'section',
          'enrollment_status',
          'emergency_contact_name',
        ],
        hashOnly: [],
        excluded: ['medical_notes', 'allergies', 'notes'],
      },
    },
  ],
}

export default searchConfig
export const config = searchConfig
