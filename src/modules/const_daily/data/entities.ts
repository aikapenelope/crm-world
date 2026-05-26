import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

export enum WeatherCondition {
  SUNNY = 'sunny',
  CLOUDY = 'cloudy',
  RAINY = 'rainy',
  WINDY = 'windy',
  FOGGY = 'foggy',
}

export enum ReportStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
}

@Entity({ tableName: 'const_daily_reports' })
export class ConstDailyReportEntity {
  @PrimaryKey({ type: 'uuid' }) id: string = v4()
  @Property({ type: 'text' }) tenant_id!: string
  @Property({ type: 'text' }) organization_id!: string
  @Property({ type: 'uuid' }) project_id!: string
  @Property({ type: 'text', length: 20 }) report_number!: string
  @Property({ type: 'date' }) report_date!: Date
  @Enum({ items: () => WeatherCondition, type: 'string', length: 10 }) weather!: WeatherCondition
  @Property({ type: 'int', nullable: true }) temperature_high?: number | null
  @Property({ type: 'int', nullable: true }) temperature_low?: number | null
  @Property({ type: 'decimal', precision: 4, scale: 1, default: '8.0' }) work_hours: string = '8.0'
  @Enum({ items: () => ReportStatus, type: 'string', length: 15 }) status!: ReportStatus
  @Property({ type: 'text', nullable: true }) overall_notes?: string | null
  @Property({ type: 'int', default: 0 }) safety_incidents: number = 0
  @Property({ type: 'text', nullable: true }) safety_notes?: string | null
  @Property({ type: 'text', length: 255, nullable: true }) submitted_by?: string | null
  @Property({ type: 'timestamptz' }) created_at: Date = new Date()
  @Property({ type: 'timestamptz', onUpdate: () => new Date() }) updated_at: Date = new Date()
}

@Entity({ tableName: 'const_daily_labor' })
export class ConstDailyLaborEntity {
  @PrimaryKey({ type: 'uuid' }) id: string = v4()
  @Property({ type: 'uuid' }) report_id!: string
  @Property({ type: 'text', length: 100 }) trade!: string
  @Property({ type: 'int' }) headcount!: number
  @Property({ type: 'decimal', precision: 5, scale: 1 }) hours_worked!: string
  @Property({ type: 'text', length: 255, nullable: true }) contractor_name?: string | null
  @Property({ type: 'text', nullable: true }) notes?: string | null
}

@Entity({ tableName: 'const_daily_activities' })
export class ConstDailyActivityEntity {
  @PrimaryKey({ type: 'uuid' }) id: string = v4()
  @Property({ type: 'uuid' }) report_id!: string
  @Property({ type: 'uuid', nullable: true }) task_id?: string | null
  @Property({ type: 'text', length: 255 }) area!: string
  @Property({ type: 'text' }) description!: string
  @Property({ type: 'decimal', precision: 12, scale: 4, nullable: true }) quantity?: string | null
  @Property({ type: 'text', length: 20, nullable: true }) unit?: string | null
  @Property({ type: 'decimal', precision: 5, scale: 2, nullable: true }) percent_complete?: string | null
}
