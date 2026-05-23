import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

// =============================================================================
// AgriEmployee — Personal del sector agropecuario
// =============================================================================

/**
 * Tres tipos de trabajador con regímenes distintos bajo LOTTT Venezuela:
 *
 * fixed     = Personal fijo mensual (gerentes, técnicos, operadores).
 *             Nómina estándar con todos los beneficios LOTTT completos.
 *
 * jornalero = Trabajador por día. Se paga por jornal (día completo).
 *             Derechos proporcionales: vacaciones, utilidades y prestaciones
 *             se calculan como provisión diaria sobre el jornal.
 *
 * destajero = Trabajador por producción. Se paga por unidad producida
 *             (tonelada cargada, caja empacada, ave procesada).
 *             Mismos derechos proporcionales que el jornalero.
 *
 * Para los productores integrados (granjeros bajo contrato de integración),
 * usar AgriProducerSettlement — NO son empleados sino proveedores de servicio.
 */
@Entity({ tableName: 'agri_employees' })
export class AgriEmployeeEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'text', length: 150 })
  first_name!: string

  @Property({ type: 'text', length: 150 })
  last_name!: string

  /** Cédula de identidad venezolana (V-XXXXXXXX o E-XXXXXXXX) */
  @Property({ type: 'text', length: 20, nullable: true })
  cedula?: string | null

  /** fixed | jornalero | destajero */
  @Property({ type: 'text', length: 20 })
  employee_type: string = 'fixed'

  @Property({ type: 'text', length: 100, nullable: true })
  department?: string | null

  @Property({ type: 'text', length: 150, nullable: true })
  position?: string | null

  @Property({ type: 'date' })
  hire_date!: Date

  /** Salario mensual base en USD (empleados fijos) */
  @Property({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  salary_usd?: string | null

  /** Jornal diario en USD (jornaleros) */
  @Property({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  base_jornal_usd?: string | null

  /** Tarifa por unidad en USD (destajeros) */
  @Property({ type: 'decimal', precision: 8, scale: 4, nullable: true })
  base_destajo_usd?: string | null

  /** Unidad de destajo: ton | box | bird | hour | kg */
  @Property({ type: 'text', length: 20, nullable: true })
  destajo_unit?: string | null

  @Property({ type: 'text', length: 100, nullable: true })
  bank_name?: string | null

  @Property({ type: 'text', length: 30, nullable: true })
  bank_account?: string | null

  /** active | inactive | terminated */
  @Property({ type: 'text', length: 20 })
  status: string = 'active'

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()

  @Property({ type: 'timestamptz', nullable: true })
  deleted_at?: Date | null
}

// =============================================================================
// AgriJornaleroPayroll — Nómina de Jornaleros y Destajeros
// =============================================================================

/**
 * Registro de pago para jornaleros y destajeros por período de trabajo.
 *
 * Las provisiones se calculan sobre el bruto del período:
 *   - Vacaciones: 15 días/año proporcional = bruto × (15/365)
 *   - Utilidades: mínimo 30 días/año = bruto × (30/365) [ajustable por empresa]
 *   - Prestaciones sociales: 15 días/año primeros 5 años = bruto × (15/365)
 *
 * Nota: estas son las tasas mínimas LOTTT. Muchas empresas aplican tasas
 * superiores por convenio colectivo o política interna.
 */
@Entity({ tableName: 'agri_jornalero_payrolls' })
export class AgriJornaleroPayrollEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  employee_id!: string

  @Property({ type: 'date' })
  period_start!: Date

  @Property({ type: 'date' })
  period_end!: Date

  /** Días trabajados (jornaleros) */
  @Property({ type: 'int', nullable: true })
  days_worked?: number | null

  /** Unidades producidas (destajeros) */
  @Property({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  units_worked?: string | null

  /** Pago bruto del período en USD */
  @Property({ type: 'decimal', precision: 10, scale: 2 })
  gross_usd!: string

  /** Provisión de vacaciones = gross × (15/365) */
  @Property({ type: 'decimal', precision: 10, scale: 4 })
  vacation_provision_usd: string = '0.0000'

  /** Provisión de utilidades = gross × (30/365) */
  @Property({ type: 'decimal', precision: 10, scale: 4 })
  bonus_provision_usd: string = '0.0000'

  /** Provisión de prestaciones sociales = gross × (15/365) */
  @Property({ type: 'decimal', precision: 10, scale: 4 })
  severance_provision_usd: string = '0.0000'

  /** Suma de todas las provisiones */
  @Property({ type: 'decimal', precision: 10, scale: 4 })
  total_provisions_usd: string = '0.0000'

  /** Pago neto al trabajador (gross_usd, las provisiones son pasivos contables) */
  @Property({ type: 'decimal', precision: 10, scale: 2 })
  net_usd!: string

  /** draft | approved | paid */
  @Property({ type: 'text', length: 20 })
  status: string = 'draft'

  @Property({ type: 'date', nullable: true })
  payment_date?: Date | null

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}

// =============================================================================
// AgriProducerSettlement — Liquidación del Productor Integrado
// =============================================================================

/**
 * Liquidación al final de cada ciclo de producción para los productores
 * integrados (granjeros que crían bajo contrato de integración).
 *
 * El productor integrado NO es empleado. Es un proveedor de servicio.
 * Se le paga según los resultados reales del ciclo comparados con
 * los objetivos del contrato de integración:
 *
 *   Pago base = aves finales × peso_promedio × precio_base_usd_kg
 *   Bonus FCA = si FCA_real < FCA_objetivo → bonus por eficiencia
 *   Bonus peso = si peso_real > peso_objetivo → bonus por excelencia
 *   Penalización FCA = si FCA_real > límite_contrato → deducción
 *
 * Este modelo incentiva al productor a manejar bien el ciclo porque
 * su ingreso depende directamente del desempeño productivo.
 *
 * La liquidación requiere aprobación del gerente antes de pagarse.
 * Workflow: liquidacion_productor_v1
 */
@Entity({ tableName: 'agri_producer_settlements' })
export class AgriProducerSettlementEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  /** ID del productor integrado en el módulo customers */
  @Property({ type: 'uuid' })
  producer_id!: string

  @Property({ type: 'uuid' })
  farm_unit_id!: string

  @Property({ type: 'uuid' })
  flock_id!: string

  @Property({ type: 'date' })
  cycle_start_date!: Date

  @Property({ type: 'date' })
  cycle_end_date!: Date

  @Property({ type: 'int' })
  initial_birds!: number

  @Property({ type: 'int' })
  final_birds!: number

  /** FCA real logrado durante el ciclo */
  @Property({ type: 'decimal', precision: 6, scale: 3 })
  actual_fca!: string

  /** Peso promedio real al final del ciclo (kg) */
  @Property({ type: 'decimal', precision: 6, scale: 3 })
  actual_avg_weight_kg!: string

  /** Mortalidad real del ciclo (%) */
  @Property({ type: 'decimal', precision: 5, scale: 2 })
  actual_mortality_pct!: string

  /** FCA objetivo del contrato de integración */
  @Property({ type: 'decimal', precision: 6, scale: 3 })
  target_fca!: string

  /** Peso objetivo del contrato (kg) */
  @Property({ type: 'decimal', precision: 6, scale: 3 })
  target_weight_kg!: string

  /** Precio base por kg producido en USD (según contrato) */
  @Property({ type: 'decimal', precision: 8, scale: 4 })
  price_per_kg_usd!: string

  /** Pago base = aves_finales × peso_promedio × precio_base */
  @Property({ type: 'decimal', precision: 12, scale: 2 })
  base_payment_usd!: string

  /** Bonus por FCA superior al objetivo */
  @Property({ type: 'decimal', precision: 10, scale: 2 })
  fca_bonus_usd: string = '0.00'

  /** Bonus por peso superior al objetivo */
  @Property({ type: 'decimal', precision: 10, scale: 2 })
  weight_bonus_usd: string = '0.00'

  /** Penalización si FCA > límite del contrato */
  @Property({ type: 'decimal', precision: 10, scale: 2 })
  fca_penalty_usd: string = '0.00'

  /** Total a pagar al productor = base + bonos - penalizaciones */
  @Property({ type: 'decimal', precision: 12, scale: 2 })
  total_payment_usd!: string

  /** calculated | approved | paid */
  @Property({ type: 'text', length: 20 })
  status: string = 'calculated'

  @Property({ type: 'uuid', nullable: true })
  approved_by?: string | null

  @Property({ type: 'timestamptz', nullable: true })
  approved_at?: Date | null

  @Property({ type: 'date', nullable: true })
  payment_date?: Date | null

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}
