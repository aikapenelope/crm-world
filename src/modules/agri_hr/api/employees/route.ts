import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { AgriEmployeeEntity } from '../../data/entities'
import { employeeCreateSchema, employeeUpdateSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1), pageSize: z.coerce.number().min(1).max(100).default(50),
  employee_type: z.string().optional(), status: z.string().optional(), department: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET:    { requireAuth: true, requireFeatures: ['agri_hr.view'] },
  POST:   { requireAuth: true, requireFeatures: ['agri_hr.create'] },
  PUT:    { requireAuth: true, requireFeatures: ['agri_hr.edit'] },
  DELETE: { requireAuth: true, requireFeatures: ['agri_hr.delete'] },
}
export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: AgriEmployeeEntity, idField: 'id', orgField: 'organization_id', tenantField: 'tenant_id', softDeleteField: 'deleted_at' },
  indexer: { entityType: 'agri_hr:employee' },
  list: { schema: listSchema },
  create: { schema: employeeCreateSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: employeeUpdateSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})
export const GET = crud.GET; export const POST = crud.POST
export const PUT = crud.PUT; export const DELETE = crud.DELETE
export const openApi = {}
