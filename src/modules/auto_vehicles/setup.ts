import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'
import type { EntityManager } from '@mikro-orm/postgresql'

type SeedScope = { tenantId: string; organizationId: string }

// ---------------------------------------------------------------------------
// Marcas y modelos populares en Venezuela
// ---------------------------------------------------------------------------
const VE_VEHICLE_BRANDS = [
  { code: 'toyota', name: 'Toyota', models: ['Corolla', 'Hilux', 'Fortuner', 'Yaris', 'Land Cruiser', '4Runner', 'RAV4', 'Camry'] },
  { code: 'chevrolet', name: 'Chevrolet', models: ['Aveo', 'Spark', 'Cruze', 'Captiva', 'Tahoe', 'Silverado', 'Trailblazer', 'Optra'] },
  { code: 'ford', name: 'Ford', models: ['Explorer', 'F-150', 'Ranger', 'Escape', 'Fiesta', 'Focus', 'Expedition', 'Maverick'] },
  { code: 'hyundai', name: 'Hyundai', models: ['Tucson', 'Santa Fe', 'Accent', 'Elantra', 'Creta', 'Grand i10', 'Sonata'] },
  { code: 'kia', name: 'Kia', models: ['Sportage', 'Rio', 'Sorento', 'Cerato', 'Seltos', 'Picanto', 'Soul'] },
  { code: 'mitsubishi', name: 'Mitsubishi', models: ['L200', 'Montero', 'Outlander', 'Lancer', 'ASX', 'Eclipse Cross'] },
  { code: 'nissan', name: 'Nissan', models: ['Sentra', 'Frontier', 'Pathfinder', 'Versa', 'X-Trail', 'Kicks', 'Tiida'] },
  { code: 'mazda', name: 'Mazda', models: ['3', '6', 'CX-5', 'CX-3', 'CX-30', 'BT-50', '2'] },
  { code: 'jeep', name: 'Jeep', models: ['Grand Cherokee', 'Wrangler', 'Cherokee', 'Compass', 'Renegade'] },
  { code: 'dodge', name: 'Dodge', models: ['Ram', 'Durango', 'Charger', 'Journey', 'Caliber'] },
  { code: 'volkswagen', name: 'Volkswagen', models: ['Gol', 'Amarok', 'Tiguan', 'Jetta', 'Golf', 'Polo'] },
  { code: 'honda', name: 'Honda', models: ['Civic', 'CR-V', 'HR-V', 'Accord', 'City', 'Fit'] },
  { code: 'renault', name: 'Renault', models: ['Logan', 'Duster', 'Sandero', 'Koleos', 'Captur', 'Symbol'] },
  { code: 'chery', name: 'Chery', models: ['Tiggo 2', 'Tiggo 4', 'Tiggo 7', 'Tiggo 8', 'Arrizo 5', 'QQ'] },
  { code: 'suzuki', name: 'Suzuki', models: ['Grand Vitara', 'Swift', 'Jimny', 'S-Cross', 'Vitara'] },
]

// ---------------------------------------------------------------------------
// Servicios comunes de taller en Venezuela
// ---------------------------------------------------------------------------
const VE_COMMON_SERVICES = [
  { code: 'cambio_aceite', name: 'Cambio de aceite y filtro', category: 'engine', estimated_hours: 0.5 },
  { code: 'alineacion_balanceo', name: 'Alineación y balanceo', category: 'tires', estimated_hours: 1 },
  { code: 'frenos_delanteros', name: 'Cambio de pastillas de freno delanteras', category: 'brakes', estimated_hours: 1.5 },
  { code: 'frenos_traseros', name: 'Cambio de pastillas de freno traseras', category: 'brakes', estimated_hours: 1.5 },
  { code: 'bateria', name: 'Cambio de batería', category: 'electrical', estimated_hours: 0.5 },
  { code: 'aire_acondicionado', name: 'Recarga de aire acondicionado', category: 'cooling', estimated_hours: 1 },
  { code: 'correa_tiempo', name: 'Cambio de correa de tiempo', category: 'engine', estimated_hours: 4 },
  { code: 'bujias', name: 'Cambio de bujías', category: 'engine', estimated_hours: 1 },
  { code: 'amortiguadores', name: 'Cambio de amortiguadores', category: 'suspension', estimated_hours: 2 },
  { code: 'tren_delantero', name: 'Reparación de tren delantero', category: 'steering', estimated_hours: 3 },
  { code: 'embrague', name: 'Cambio de embrague (kit completo)', category: 'transmission', estimated_hours: 5 },
  { code: 'radiador', name: 'Cambio/reparación de radiador', category: 'cooling', estimated_hours: 2 },
  { code: 'alternador', name: 'Cambio de alternador', category: 'electrical', estimated_hours: 1.5 },
  { code: 'arranque', name: 'Cambio de motor de arranque', category: 'electrical', estimated_hours: 1.5 },
  { code: 'filtro_aire', name: 'Cambio de filtro de aire', category: 'filters', estimated_hours: 0.25 },
  { code: 'filtro_gasolina', name: 'Cambio de filtro de gasolina', category: 'filters', estimated_hours: 0.5 },
  { code: 'scanner', name: 'Diagnóstico por scanner (OBD2)', category: 'electrical', estimated_hours: 0.5 },
  { code: 'cauchos', name: 'Montaje de cauchos (4)', category: 'tires', estimated_hours: 1 },
  { code: 'aceite_caja', name: 'Cambio de aceite de caja', category: 'transmission', estimated_hours: 1 },
  { code: 'revision_general', name: 'Revisión general (chequeo 20 puntos)', category: 'other', estimated_hours: 1 },
]

async function seedVehicleBrands(em: EntityManager, scope: SeedScope): Promise<void> {
  try {
    const { CustomerDictionaryEntry } = await import(
      '@open-mercato/core/modules/customers/data/entities'
    )

    const existing = await em.find(CustomerDictionaryEntry, {
      tenantId: scope.tenantId,
      organizationId: scope.organizationId,
      kind: 'auto-brands',
      deletedAt: null,
    } as any)
    const existingCodes = new Set(existing.map((e: any) => e.code))

    const now = new Date()
    let order = 1
    for (const brand of VE_VEHICLE_BRANDS) {
      if (existingCodes.has(brand.code)) continue
      em.persist(
        em.create(CustomerDictionaryEntry, {
          tenantId: scope.tenantId,
          organizationId: scope.organizationId,
          kind: 'auto-brands',
          code: brand.code,
          label: brand.name,
          sortOrder: order++,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        } as any),
      )
      // Seed models as sub-entries
      for (const model of brand.models) {
        const modelCode = `${brand.code}_${model.toLowerCase().replace(/\s+/g, '_')}`
        if (existingCodes.has(modelCode)) continue
        em.persist(
          em.create(CustomerDictionaryEntry, {
            tenantId: scope.tenantId,
            organizationId: scope.organizationId,
            kind: 'auto-models',
            code: modelCode,
            label: `${brand.name} ${model}`,
            sortOrder: order++,
            isActive: true,
            createdAt: now,
            updatedAt: now,
          } as any),
        )
      }
    }

    await em.flush()
    console.log(`[auto_vehicles] Seeded ${VE_VEHICLE_BRANDS.length} brands with models`)
  } catch (err: any) {
    console.warn(`[auto_vehicles] Could not seed brands: ${err.message}`)
  }
}

async function seedCommonServices(em: EntityManager, scope: SeedScope): Promise<void> {
  try {
    const { CustomerDictionaryEntry } = await import(
      '@open-mercato/core/modules/customers/data/entities'
    )

    const existing = await em.find(CustomerDictionaryEntry, {
      tenantId: scope.tenantId,
      organizationId: scope.organizationId,
      kind: 'auto-services',
      deletedAt: null,
    } as any)
    const existingCodes = new Set(existing.map((e: any) => e.code))

    const now = new Date()
    let order = 1
    for (const service of VE_COMMON_SERVICES) {
      if (existingCodes.has(service.code)) continue
      em.persist(
        em.create(CustomerDictionaryEntry, {
          tenantId: scope.tenantId,
          organizationId: scope.organizationId,
          kind: 'auto-services',
          code: service.code,
          label: service.name,
          sortOrder: order++,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        } as any),
      )
    }

    await em.flush()
    console.log(`[auto_vehicles] Seeded ${VE_COMMON_SERVICES.length} common services`)
  } catch (err: any) {
    console.warn(`[auto_vehicles] Could not seed services: ${err.message}`)
  }
}

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: ['auto_vehicles.*'],
    employee: ['auto_vehicles.view', 'auto_vehicles.create', 'auto_vehicles.photos'],
  },

  async seedDefaults({ em, tenantId, organizationId }) {
    const scope = { tenantId, organizationId }
    await seedVehicleBrands(em as EntityManager, scope)
    await seedCommonServices(em as EntityManager, scope)
  },
}

export default setup
