/**
 * Unit tests — retail_branches validators
 *
 * Venezuelan retail context:
 *   - branch_type 'kiosk': módulo o kiosco en centro comercial — common in
 *     Sambil, Galerías, Líder; lower overhead than full stores
 *   - operating_hours: horario de atención — flexible object per day of week
 *   - Transfers (traslados entre tiendas) require approval workflow to prevent
 *     inventory discrepancies; status 'pending_approval' is mandatory step
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 */

import {
  createBranchSchema,
  updateBranchSchema,
  listBranchSchema,
  createStaffSchema,
  listStaffSchema,
  createTransferSchema,
  updateTransferSchema,
  listTransferSchema,
} from '../data/validators'

const UUID  = '11111111-1111-4111-8111-111111111111'
const UUID2 = '22222222-2222-4222-8222-222222222222'

const validBranch = () => ({ name: 'Tienda Sambil Caracas', code: 'BR-CAR-001' })
const validStaff  = () => ({ branch_id: UUID, user_id: UUID2, role: 'cashier' as const })
const validTransfer = () => ({
  from_branch_id: UUID, to_branch_id: UUID2,
  lines: [{ product_id: UUID, quantity_requested: 10 }],
})

// ---------------------------------------------------------------------------
// createBranchSchema
// ---------------------------------------------------------------------------
describe('createBranchSchema', () => {
  it('accepts minimal branch with defaults', () => {
    const r = createBranchSchema.safeParse(validBranch())
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.branch_type).toBe('store')
      expect(r.data.is_active).toBe(true)
    }
  })
  it('rejects missing name', () => {
    const { name: _o, ...rest } = validBranch()
    expect(createBranchSchema.safeParse(rest).success).toBe(false)
  })
  it('rejects missing code', () => {
    const { code: _o, ...rest } = validBranch()
    expect(createBranchSchema.safeParse(rest).success).toBe(false)
  })
  it('accepts valid email', () => {
    expect(createBranchSchema.safeParse({ ...validBranch(), email: 'tienda@sambil.com' }).success).toBe(true)
  })
  it('rejects invalid email', () => {
    expect(createBranchSchema.safeParse({ ...validBranch(), email: 'not-email' }).success).toBe(false)
  })
  it('accepts email as null', () => {
    expect(createBranchSchema.safeParse({ ...validBranch(), email: null }).success).toBe(true)
  })
  it('accepts operating_hours record', () => {
    const r = createBranchSchema.safeParse({
      ...validBranch(),
      operating_hours: { lunes: { open: '09:00', close: '20:00' } },
    })
    expect(r.success).toBe(true)
  })
  it('accepts operating_hours as null', () => {
    expect(createBranchSchema.safeParse({ ...validBranch(), operating_hours: null }).success).toBe(true)
  })

  describe('branch_type enum', () => {
    const types = ['store', 'warehouse', 'kiosk', 'popup'] as const
    test.each(types)('accepts branch_type "%s"', (branch_type) => {
      expect(createBranchSchema.safeParse({ ...validBranch(), branch_type }).success).toBe(true)
    })
    it('rejects invalid branch_type', () => {
      expect(createBranchSchema.safeParse({ ...validBranch(), branch_type: 'depot' }).success).toBe(false)
    })
  })
})

describe('updateBranchSchema', () => {
  it('accepts empty object', () => { expect(updateBranchSchema.safeParse({}).success).toBe(true) })
  it('accepts is_active update', () => { expect(updateBranchSchema.safeParse({ is_active: false }).success).toBe(true) })
})

describe('listBranchSchema', () => {
  it('accepts empty input with defaults', () => {
    const r = listBranchSchema.safeParse({})
    expect(r.success).toBe(true)
    if (r.success) { expect(r.data.page).toBe(1); expect(r.data.pageSize).toBe(50) }
  })
  it('coerces page from string', () => {
    const r = listBranchSchema.safeParse({ page: '2', pageSize: '20' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.page).toBe(2)
  })
  it('coerces is_active boolean from string', () => {
    const r = listBranchSchema.safeParse({ is_active: 'true' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.is_active).toBe(true)
  })
  it('rejects pageSize above 100', () => {
    expect(listBranchSchema.safeParse({ pageSize: '101' }).success).toBe(false)
  })
  it('passes through unknown fields', () => {
    expect(listBranchSchema.safeParse({ extra: 'x' }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// createStaffSchema
// ---------------------------------------------------------------------------
describe('createStaffSchema', () => {
  it('accepts minimal staff with defaults', () => {
    const r = createStaffSchema.safeParse(validStaff())
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.is_primary).toBe(false)
  })
  it('rejects non-UUID branch_id', () => {
    expect(createStaffSchema.safeParse({ ...validStaff(), branch_id: 'bad' }).success).toBe(false)
  })
  it('rejects non-UUID user_id', () => {
    expect(createStaffSchema.safeParse({ ...validStaff(), user_id: 'bad' }).success).toBe(false)
  })

  describe('role enum', () => {
    const roles = ['manager', 'cashier', 'stock_clerk', 'sales_rep'] as const
    test.each(roles)('accepts role "%s"', (role) => {
      expect(createStaffSchema.safeParse({ ...validStaff(), role }).success).toBe(true)
    })
    it('rejects invalid role', () => {
      expect(createStaffSchema.safeParse({ ...validStaff(), role: 'supervisor' }).success).toBe(false)
    })
  })
})

describe('listStaffSchema', () => {
  it('accepts empty input with defaults', () => {
    const r = listStaffSchema.safeParse({})
    expect(r.success).toBe(true)
    if (r.success) { expect(r.data.page).toBe(1); expect(r.data.pageSize).toBe(50) }
  })
  it('accepts branch_id filter as UUID', () => {
    expect(listStaffSchema.safeParse({ branch_id: UUID }).success).toBe(true)
  })
  it('rejects non-UUID branch_id filter', () => {
    expect(listStaffSchema.safeParse({ branch_id: 'bad' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// createTransferSchema
// ---------------------------------------------------------------------------
describe('createTransferSchema', () => {
  it('accepts minimal valid transfer', () => {
    expect(createTransferSchema.safeParse(validTransfer()).success).toBe(true)
  })
  it('rejects non-UUID from_branch_id', () => {
    expect(createTransferSchema.safeParse({ ...validTransfer(), from_branch_id: 'bad' }).success).toBe(false)
  })
  it('rejects empty lines array (min 1)', () => {
    expect(createTransferSchema.safeParse({ ...validTransfer(), lines: [] }).success).toBe(false)
  })
  it('rejects line quantity_requested below 1', () => {
    const t = { ...validTransfer(), lines: [{ product_id: UUID, quantity_requested: 0 }] }
    expect(createTransferSchema.safeParse(t).success).toBe(false)
  })
  it('accepts multiple lines', () => {
    const t = {
      ...validTransfer(),
      lines: [
        { product_id: UUID, quantity_requested: 5 },
        { product_id: UUID2, quantity_requested: 3 },
      ],
    }
    expect(createTransferSchema.safeParse(t).success).toBe(true)
  })
  it('accepts notes as null', () => {
    expect(createTransferSchema.safeParse({ ...validTransfer(), notes: null }).success).toBe(true)
  })
})

describe('updateTransferSchema', () => {
  it('accepts empty object', () => { expect(updateTransferSchema.safeParse({}).success).toBe(true) })

  describe('status enum', () => {
    const statuses = ['pending_approval', 'approved', 'in_transit', 'received', 'cancelled'] as const
    test.each(statuses)('accepts status "%s"', (status) => {
      expect(updateTransferSchema.safeParse({ status }).success).toBe(true)
    })
    it('rejects invalid status', () => {
      expect(updateTransferSchema.safeParse({ status: 'rejected' }).success).toBe(false)
    })
  })
})

describe('listTransferSchema', () => {
  it('accepts empty input with defaults', () => {
    const r = listTransferSchema.safeParse({})
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.page).toBe(1)
  })

  describe('status filter enum', () => {
    const statuses = ['draft', 'pending_approval', 'approved', 'in_transit', 'received', 'cancelled'] as const
    test.each(statuses)('accepts status filter "%s"', (status) => {
      expect(listTransferSchema.safeParse({ status }).success).toBe(true)
    })
  })
})
