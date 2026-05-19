/**
 * Matching Scoring Engine
 *
 * Calculates compatibility scores between contact preferences and properties.
 * Uses weighted criteria: type (30%), city (25%), budget (25%), operation (20%).
 *
 * Does NOT import entities cross-module — uses Kysely for all queries.
 */
import type { EntityManager } from '@mikro-orm/core'

// =============================================================================
// Types
// =============================================================================

export type MatchScore = {
  contactId: string
  propertyId: string
  score: number
  breakdown: Record<string, number>
}

export type ScoringWeights = {
  property_type: number
  city: number
  budget: number
  operation: number
}

// =============================================================================
// Default Weights (total = 100)
// =============================================================================

const DEFAULT_WEIGHTS: ScoringWeights = {
  property_type: 30,
  city: 25,
  budget: 25,
  operation: 20,
}

// =============================================================================
// Scoring Engine
// =============================================================================

export class ScoringEngine {
  private readonly weights: ScoringWeights

  constructor(
    private readonly em: EntityManager,
    weights?: Partial<ScoringWeights>,
  ) {
    this.weights = { ...DEFAULT_WEIGHTS, ...weights }
  }

  /**
   * Score all active preferences against a specific property.
   * Returns sorted results (highest score first).
   */
  async scoreForProperty(propertyId: string, tenantId: string): Promise<MatchScore[]> {
    const kysely = (this.em as any).getKysely()

    const property = await kysely
      .selectFrom('properties')
      .selectAll()
      .where('id', '=', propertyId)
      .where('tenant_id', '=', tenantId)
      .where('deleted_at', 'is', null)
      .executeTakeFirst()

    if (!property) return []

    const preferences = await kysely
      .selectFrom('contact_preferences')
      .selectAll()
      .where('tenant_id', '=', tenantId)
      .where('is_active', '=', true)
      .where('deleted_at', 'is', null)
      .execute()

    const scores = preferences
      .map((pref: any) => this.calculateScore(property, pref))
      .filter((s: MatchScore) => s.score > 0)
      .sort((a: MatchScore, b: MatchScore) => b.score - a.score)

    return scores
  }

  /**
   * Score all active properties against a specific contact's preferences.
   * Returns sorted results (highest score first).
   */
  async scoreForContact(contactId: string, tenantId: string): Promise<MatchScore[]> {
    const kysely = (this.em as any).getKysely()

    const preference = await kysely
      .selectFrom('contact_preferences')
      .selectAll()
      .where('contact_id', '=', contactId)
      .where('tenant_id', '=', tenantId)
      .where('is_active', '=', true)
      .where('deleted_at', 'is', null)
      .executeTakeFirst()

    if (!preference) return []

    const properties = await kysely
      .selectFrom('properties')
      .selectAll()
      .where('tenant_id', '=', tenantId)
      .where('status', 'in', ['active', 'reserved'])
      .where('deleted_at', 'is', null)
      .execute()

    const scores = properties
      .map((prop: any) => this.calculateScore(prop, preference))
      .filter((s: MatchScore) => s.score > 0)
      .sort((a: MatchScore, b: MatchScore) => b.score - a.score)

    return scores
  }

  /**
   * Calculate score for a single property-preference pair.
   */
  private calculateScore(property: any, preference: any): MatchScore {
    const breakdown: Record<string, number> = {}
    let total = 0

    // Property type match (exact)
    if (preference.preferred_type && preference.preferred_type === property.property_type) {
      breakdown.property_type = this.weights.property_type
      total += this.weights.property_type
    }

    // City match (case-insensitive contains)
    if (preference.preferred_city && property.city) {
      const prefCity = String(preference.preferred_city).toLowerCase().trim()
      const propCity = String(property.city).toLowerCase().trim()
      if (propCity === prefCity || propCity.includes(prefCity) || prefCity.includes(propCity)) {
        breakdown.city = this.weights.city
        total += this.weights.city
      }
    }

    // Budget match (property price within budget)
    if (preference.max_budget && property.price) {
      const budget = parseFloat(preference.max_budget)
      const price = parseFloat(property.price)
      if (!isNaN(budget) && !isNaN(price) && budget > 0) {
        if (price <= budget) {
          // Within budget: full score
          breakdown.budget = this.weights.budget
          total += this.weights.budget
        } else if (price <= budget * 1.15) {
          // Up to 15% over budget: partial score
          breakdown.budget = Math.round(this.weights.budget * 0.5)
          total += breakdown.budget
        }
      }
    }

    // Operation match
    if (preference.preferred_operation) {
      const prefOp = preference.preferred_operation
      const propOp = property.operation
      if (prefOp === propOp || propOp === 'venta_alquiler') {
        breakdown.operation = this.weights.operation
        total += this.weights.operation
      }
    }

    return {
      contactId: preference.contact_id,
      propertyId: property.id,
      score: total,
      breakdown,
    }
  }
}
