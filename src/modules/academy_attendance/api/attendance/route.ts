import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { AcademyAttendanceEntity } from '../../data/entities'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(500).default(200),
  session_id: z.string().uuid().optional(),
  enrollment_id: z.string().uuid().optional(),
  status: z.string().optional(),
}).passthrough()

const createSchema = z.object({
  session_id: z.string().uuid(),
  enrollment_id: z.string().uuid(),
  status: z.enum(['present', 'absent', 'late', 'excused']).default('present'),
  notes: z.string().max(500).optional().nullable(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['academy_attendance.view'] },
  POST: { requireAuth: true, requireFeatures: ['academy_attendance.manage'] },
  PUT: { requireAuth: true, requireFeatures: ['academy_attendance.manage'] },
  DELETE: { requireAuth: true, requireFeatures: ['academy_attendance.manage'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: AcademyAttendanceEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
  },
  indexer: { entityType: 'academy_attendance.record' },
  list: { schema: listSchema },
  create: {
    schema: createSchema,
    mapToEntity: (input: any) => ({ ...input, recorded_at: new Date() }),
  },
  update: {
    schema: createSchema.partial(),
    applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) },
  },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const DELETE = crud.DELETE
export const openApi = {}
