import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

// =============================================================================
// VaccinationProgram — Programa de Vacunación (plantilla reutilizable)
// =============================================================================

/**
 * Un programa de vacunación es una plantilla que define el calendario
 * de vacunas para una especie y tipo de producción. Se aplica a un
 * nuevo flock al momento de su inicio para generar automáticamente
 * los VaccinationRecord programados.
 *
 * El campo `vaccinations` tiene la siguiente estructura:
 * [
 *   {
 *     "vaccine_name": "Newcastle B1",
 *     "active_ingredient": "Newcastle virus vivo cepa B1",
 *     "manufacturer": "Merial",
 *     "route": "drinking_water",
 *     "age_days": 7,
 *     "dose_per_bird": 1,
 *     "dose_unit": "doses",
 *     "withdrawal_days": 0,
 *     "notes": "Diluir en agua sin cloro"
 *   }, ...
 * ]
 */
@Entity({ tableName: 'agri_vet_vaccination_programs' })
export class AgriVetVaccinationProgramEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'text', length: 255 })
  name!: string

  /** broiler | layer | turkey | swine | bovine | all */
  @Property({ type: 'text', length: 20 })
  species: string = 'broiler'

  /** Array JSON de vacunas con su calendario y dosis */
  @Property({ type: 'json' })
  vaccinations: object[] = []

  @Property({ type: 'boolean', default: true })
  is_active: boolean = true

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
// VaccinationRecord — Registro de vacunación aplicada a un flock
// =============================================================================

/**
 * Cada aplicación de vacuna a un lote de aves genera un registro.
 * Los registros pueden ser programados (generados al aplicar un programa
 * de vacunación al flock) o manuales (ad-hoc por el veterinario).
 *
 * El campo `withdrawal_end_date` bloquea el despacho del lote a beneficio:
 * ningún SlaughterBatch puede crearse mientras haya registros con
 * withdrawal_end_date > today.
 */
@Entity({ tableName: 'agri_vet_vaccination_records' })
export class AgriVetVaccinationRecordEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  flock_id!: string

  /** Si viene de un programa de vacunación — FK a agri_vet_vaccination_programs */
  @Property({ type: 'uuid', nullable: true })
  program_id?: string | null

  @Property({ type: 'text', length: 255 })
  vaccine_name!: string

  @Property({ type: 'text', length: 255, nullable: true })
  active_ingredient?: string | null

  @Property({ type: 'text', length: 255, nullable: true })
  manufacturer?: string | null

  /**
   * drinking_water | ocular | injectable | spray | subcutaneous | oral
   */
  @Property({ type: 'text', length: 20 })
  administration_route: string = 'drinking_water'

  /** Fecha programada de aplicación (flock.start_date + age_days del programa) */
  @Property({ type: 'date' })
  scheduled_date!: Date

  /** Fecha real de aplicación (null si aún no se ha aplicado) */
  @Property({ type: 'date', nullable: true })
  applied_date?: Date | null

  /** scheduled | applied | missed | cancelled */
  @Property({ type: 'text', length: 20 })
  status: string = 'scheduled'

  @Property({ type: 'int', nullable: true })
  birds_treated?: number | null

  @Property({ type: 'decimal', precision: 8, scale: 3, nullable: true })
  dose_applied?: string | null

  /** ml | doses | mg */
  @Property({ type: 'text', length: 10, nullable: true })
  dose_unit?: string | null

  /** Lote del fabricante de la vacuna — para trazabilidad */
  @Property({ type: 'text', length: 100, nullable: true })
  vaccine_lot_number?: string | null

  @Property({ type: 'date', nullable: true })
  vaccine_expiry_date?: Date | null

  /** Días de retiro antes del beneficio */
  @Property({ type: 'int' })
  withdrawal_days: number = 0

  /**
   * applied_date + withdrawal_days.
   * CRÍTICO: si withdrawal_end_date > today, el flock NO puede ir a beneficio.
   * El API de agri_processing verifica este campo antes de crear un SlaughterBatch.
   */
  @Property({ type: 'date', nullable: true })
  withdrawal_end_date?: Date | null

  /** UUID del usuario que registró la aplicación */
  @Property({ type: 'uuid', nullable: true })
  operator_id?: string | null

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}

// =============================================================================
// MedicationRecord — Tratamiento medicamentoso por lote
// =============================================================================

/**
 * Registro de cada tratamiento aplicado a un lote de aves.
 * El período de retiro (withdrawal_end_date) es el campo más crítico:
 * determina la fecha más temprana en que el lote puede ir a beneficio
 * sin violar las normas del INSAI y los requisitos de los clientes.
 */
@Entity({ tableName: 'agri_vet_medication_records' })
export class AgriVetMedicationRecordEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  flock_id!: string

  @Property({ type: 'text', length: 500 })
  diagnosis!: string

  @Property({ type: 'text', length: 255 })
  medication_name!: string

  @Property({ type: 'text', length: 255, nullable: true })
  active_ingredient?: string | null

  @Property({ type: 'text', length: 255, nullable: true })
  manufacturer?: string | null

  /** drinking_water | injectable | oral | topical | other */
  @Property({ type: 'text', length: 20 })
  administration_route: string = 'drinking_water'

  @Property({ type: 'text', length: 255, nullable: true })
  dose_description?: string | null

  @Property({ type: 'date' })
  treatment_start_date!: Date

  @Property({ type: 'int' })
  treatment_duration_days!: number

  @Property({ type: 'date' })
  treatment_end_date!: Date

  /** Nombre del veterinario responsable (texto libre) */
  @Property({ type: 'text', length: 255, nullable: true })
  veterinarian_name?: string | null

  @Property({ type: 'uuid', nullable: true })
  veterinarian_id?: string | null

  /** Lote del medicamento (número del fabricante) — para trazabilidad */
  @Property({ type: 'text', length: 100, nullable: true })
  medication_lot_number?: string | null

  @Property({ type: 'date', nullable: true })
  medication_expiry_date?: Date | null

  /** Días de retiro estipulados por el fabricante y/o el veterinario */
  @Property({ type: 'int' })
  withdrawal_days: number = 0

  /**
   * treatment_end_date + withdrawal_days.
   * Este campo es la fecha mínima para beneficiar el lote.
   * Indexado para consultas rápidas en el API de slaughter.
   */
  @Property({ type: 'date' })
  withdrawal_end_date!: Date

  /** true cuando el veterinario cierra el tratamiento como resuelto */
  @Property({ type: 'boolean', default: false })
  resolved: boolean = false

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()
}

// =============================================================================
// MortalityRecord — Registro diario de mortalidad por causa
// =============================================================================

/**
 * Registro de muertes diarias por lote y causa. Permite:
 * 1. Calcular la mortalidad acumulada real (complementa FlockWeeklyRecord)
 * 2. Analizar patrones de mortalidad por causa (sanitaria vs. manejo)
 * 3. Disparar alertas cuando la mortalidad supera el umbral diario definido
 *    en el flock (AgriFlockEntity.mortality_threshold_pct)
 */
@Entity({ tableName: 'agri_vet_mortality_records' })
export class AgriVetMortalityRecordEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'uuid' })
  flock_id!: string

  @Property({ type: 'date' })
  record_date!: Date

  @Property({ type: 'int' })
  count!: number

  /**
   * sanitary          = causa sanitaria (Newcastle, Marek, Gumboro, etc.)
   * heat_stress       = golpe de calor
   * crushing          = aplastamiento o amontonamiento
   * low_weight_selection = selección por bajo peso (culling)
   * other             = otra causa
   */
  @Property({ type: 'text', length: 30 })
  cause: string = 'other'

  @Property({ type: 'text', length: 500, nullable: true })
  cause_detail?: string | null

  @Property({ type: 'text', nullable: true })
  notes?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()
}
