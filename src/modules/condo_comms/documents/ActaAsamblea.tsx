/**
 * Acta de Asamblea de Condominios — PDF Document
 * Official assembly minutes with agenda, decisions, and vote results.
 */
// @ts-ignore
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import * as React from 'react'
import {
  COLORS, FONTS, FONT_SIZES, SPACING, PAGE,
  type OrgBranding, fmtDate, docId,
} from '../../../lib/pdf/design'
import {
  baseStyles, DocHeader, Section,
  DetailRow, DocFooter, SignatureBlock,
} from '../../../lib/pdf/components'

// ─── Types ────────────────────────────────────────────────────────────────────

export type VoteResult = {
  title: string
  vote_type: string
  total_votes: number
  total_aliquot_voted: string
  quorum_percent: string
  quorum_reached: boolean
  options: string[]
  results: Record<string, number> | null  // choice → aliquot percentage
}

export type ActaAsambleaPDFData = {
  org: OrgBranding
  buildingName: string
  assemblyNumber: string
  assemblyType: string
  title: string
  date: string
  startTime: string | null
  endTime: string | null
  location: string | null
  attendeesCount: number
  quorumPresent: string | null
  agenda: string[] | null
  minutes: string | null
  decisions: string[] | null
  votes: VoteResult[]
  id: string
}

// ─── Assembly type labels ─────────────────────────────────────────────────────

const ASSEMBLY_TYPE_LABELS: Record<string, string> = {
  ordinary: 'Asamblea Ordinaria de Propietarios',
  extraordinary: 'Asamblea Extraordinaria de Propietarios',
  emergency: 'Sesión de Emergencia',
}

const VOTE_TYPE_LABELS: Record<string, string> = {
  ordinary: 'Votación Ordinaria',
  extraordinary: 'Votación Extraordinaria',
  budget: 'Aprobación de Presupuesto',
  maintenance: 'Autorización de Mantenimiento',
  regulation: 'Modificación de Reglamento',
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  topDecoration: {
    height: 4,
    flexDirection: 'row',
  },
  segment1: { flex: 2, backgroundColor: '#1a3a2a' },
  segment2: { flex: 1, backgroundColor: '#2d6a4f' },
  segment3: { flex: 0.3, backgroundColor: COLORS.gray200 },

  assemblyTitle: {
    fontSize: FONT_SIZES['3xl'],
    fontFamily: FONTS.bold,
    color: '#1a3a2a',
    textAlign: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.xs,
  },
  assemblySubtitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.body,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  quorumBox: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  quorumCard: {
    flex: 1,
    borderRadius: 8,
    padding: SPACING.sm,
    alignItems: 'center',
    borderWidth: 1,
  },
  quorumNumber: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
  },
  quorumLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    fontFamily: FONTS.body,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginTop: 1,
  },
  agendaItem: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
    alignItems: 'flex-start',
  },
  agendaNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#1a3a2a',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  agendaNumberText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.bold,
  },
  agendaText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.body,
    color: COLORS.text,
    lineHeight: 1.5,
    paddingTop: 2,
  },
  decisionItem: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  decisionBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2d6a4f',
    marginTop: 5,
    flexShrink: 0,
  },
  voteBox: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  voteHeader: {
    backgroundColor: '#1a3a2a',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  voteTitle: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.bold,
  },
  voteType: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.body,
    marginTop: 1,
  },
  voteBody: {
    padding: 10,
  },
  voteResultBar: {
    height: 18,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: COLORS.gray100,
    flexDirection: 'row',
    marginTop: 3,
    marginBottom: 5,
  },
  quorumMet: {
    backgroundColor: '#ecfdf5',
    borderColor: '#6ee7b7',
  },
  quorumNotMet: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
  },
})

// ─── Document ─────────────────────────────────────────────────────────────────

export function ActaAsamblea({ data }: { data: ActaAsambleaPDFData }) {
  const assemblyTypeLabel = ASSEMBLY_TYPE_LABELS[data.assemblyType] ?? data.assemblyType

  const timeRange = data.startTime
    ? `${data.startTime}${data.endTime ? ` — ${data.endTime}` : ''} horas`
    : null

  return (
    <Document
      title={`Acta ${data.assemblyNumber} — ${data.buildingName}`}
      author={data.org.name}
      subject={`Acta de Asamblea ${data.assemblyType}`}
      creator="Aika Platform"
    >
      <Page size={PAGE.size} style={[baseStyles.page, { paddingBottom: 0 }]}>
        {/* ── Header ─────────────────────────────────────────────── */}
        <DocHeader
          org={data.org}
          docTitle={assemblyTypeLabel}
          docNumber={data.assemblyNumber}
          accentColor="#1a3a2a"
        />

        {/* Decorative line */}
        <View style={styles.topDecoration}>
          <View style={styles.segment1} />
          <View style={styles.segment2} />
          <View style={styles.segment3} />
        </View>

        {/* ── Content ────────────────────────────────────────────── */}
        <View style={[baseStyles.content, { paddingTop: SPACING.md }]}>

          {/* Assembly title */}
          <Text style={styles.assemblyTitle}>{data.title}</Text>
          <Text style={styles.assemblySubtitle}>{data.buildingName}</Text>

          {/* Quorum / attendance cards */}
          <View style={styles.quorumBox}>
            <View style={[styles.quorumCard, {
              borderColor: '#6ee7b7',
              backgroundColor: '#f0fdf4',
            }]}>
              <Text style={[styles.quorumNumber, { color: '#059669' }]}>{data.attendeesCount}</Text>
              <Text style={styles.quorumLabel}>Asistentes</Text>
            </View>
            {data.quorumPresent && (
              <View style={[styles.quorumCard, {
                borderColor: parseFloat(data.quorumPresent) >= 50 ? '#6ee7b7' : '#fca5a5',
                backgroundColor: parseFloat(data.quorumPresent) >= 50 ? '#f0fdf4' : '#fef2f2',
              }]}>
                <Text style={[styles.quorumNumber, {
                  color: parseFloat(data.quorumPresent) >= 50 ? '#059669' : '#dc2626',
                }]}>
                  {parseFloat(data.quorumPresent).toFixed(2)}%
                </Text>
                <Text style={styles.quorumLabel}>Quórum</Text>
              </View>
            )}
            <View style={[styles.quorumCard, { flex: 2, borderColor: COLORS.border, backgroundColor: COLORS.gray50 }]}>
              <Text style={[styles.quorumNumber, { color: '#1a3a2a', fontSize: FONT_SIZES.lg }]}>
                {fmtDate(data.date)}
              </Text>
              {timeRange && (
                <Text style={[styles.quorumLabel, { color: COLORS.textMuted }]}>{timeRange}</Text>
              )}
              {data.location && (
                <Text style={[styles.quorumLabel, { marginTop: 2 }]}>{data.location}</Text>
              )}
            </View>
          </View>

          {/* Opening paragraph */}
          <View style={{
            backgroundColor: COLORS.gray50,
            borderRadius: 6,
            borderLeftWidth: 3,
            borderLeftColor: '#2d6a4f',
            padding: SPACING.md,
            marginBottom: SPACING.lg,
          }}>
            <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.text, lineHeight: 1.6 }}>
              {'        '}
              En el Edificio <Text style={{ fontFamily: FONTS.bold }}>{data.buildingName}</Text>,
              siendo las <Text style={{ fontFamily: FONTS.bold }}>{data.startTime ?? '—'}</Text> horas
              del día <Text style={{ fontFamily: FONTS.bold }}>{fmtDate(data.date)}</Text>,
              se reunieron los propietarios de las unidades de dicho inmueble en{' '}
              <Text style={{ fontFamily: FONTS.bold }}>{assemblyTypeLabel}</Text>,
              {data.location ? ` en ${data.location},` : ''}
              {' '}contando con la asistencia de <Text style={{ fontFamily: FONTS.bold }}>{data.attendeesCount} propietarios</Text>
              {data.quorumPresent ? `, representando el ${data.quorumPresent}% de las alícuotas,` : ''}
              {' '}para tratar los puntos del orden del día que a continuación se señalan.
            </Text>
          </View>

          {/* Agenda */}
          {data.agenda && data.agenda.length > 0 && (
            <Section title="Orden del Día">
              {data.agenda.map((item, idx) => (
                <View key={idx} style={styles.agendaItem}>
                  <View style={styles.agendaNumber}>
                    <Text style={styles.agendaNumberText}>{idx + 1}</Text>
                  </View>
                  <Text style={styles.agendaText}>{item}</Text>
                </View>
              ))}
            </Section>
          )}

          {/* Vote results */}
          {data.votes.length > 0 && (
            <Section title={`Puntos Votados (${data.votes.length})`}>
              {data.votes.map((vote, idx) => {
                const quorumReached = parseFloat(vote.total_aliquot_voted) >= parseFloat(vote.quorum_percent)
                return (
                  <View key={idx} style={[styles.voteBox, quorumReached ? styles.quorumMet : styles.quorumNotMet]}>
                    <View style={styles.voteHeader}>
                      <Text style={styles.voteTitle}>{vote.title}</Text>
                      <Text style={styles.voteType}>
                        {VOTE_TYPE_LABELS[vote.vote_type] ?? vote.vote_type}
                        {'  ·  '}
                        {vote.total_votes} votos  ·  {parseFloat(vote.total_aliquot_voted).toFixed(2)}% alícuota votada
                        {'  ·  '}
                        {quorumReached ? '✓ Quórum alcanzado' : '✗ Sin quórum'}
                      </Text>
                    </View>
                    <View style={styles.voteBody}>
                      {vote.results && Object.entries(vote.results).map(([choice, aliquot], ci) => {
                        const width = Math.max(2, Math.min(100, aliquot))
                        const isYes = ['yes', 'si', 'sí', 'favor', 'aprobado'].includes(choice.toLowerCase())
                        const isNo = ['no', 'contra', 'rechazado'].includes(choice.toLowerCase())
                        const barColor = isYes ? '#059669' : isNo ? '#dc2626' : '#64748b'
                        return (
                          <View key={ci}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                              <Text style={{ fontSize: FONT_SIZES.xs, fontFamily: FONTS.bold, color: barColor, textTransform: 'capitalize' }}>
                                {choice}
                              </Text>
                              <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.textMuted }}>
                                {aliquot.toFixed(2)}%
                              </Text>
                            </View>
                            <View style={styles.voteResultBar}>
                              <View style={{ width: `${width}%`, backgroundColor: barColor }} />
                            </View>
                          </View>
                        )
                      })}
                      {!vote.results && (
                        <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.textMuted }}>
                          Resultados pendientes de tabulación.
                        </Text>
                      )}
                    </View>
                  </View>
                )
              })}
            </Section>
          )}

          {/* Minutes text */}
          {data.minutes && (
            <Section title="Desarrollo de la Asamblea">
              <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.text, lineHeight: 1.6, textAlign: 'justify' }}>
                {data.minutes}
              </Text>
            </Section>
          )}

          {/* Decisions */}
          {data.decisions && data.decisions.length > 0 && (
            <Section title="Decisiones y Acuerdos">
              {data.decisions.map((dec, idx) => (
                <View key={idx} style={styles.decisionItem}>
                  <View style={styles.decisionBullet} />
                  <Text style={{ flex: 1, fontSize: FONT_SIZES.sm, color: COLORS.text, lineHeight: 1.5 }}>
                    {dec}
                  </Text>
                </View>
              ))}
            </Section>
          )}

          {/* Closing + signatures */}
          <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.text, marginTop: SPACING.md, lineHeight: 1.6 }}>
            {'        '}No habiendo más puntos que tratar en el orden del día, se da por concluida la presente Asamblea
            siendo las <Text style={{ fontFamily: FONTS.bold }}>{data.endTime ?? '—'}</Text> horas,
            firmando los presentes en señal de conformidad.
          </Text>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.xl }}>
            <SignatureBlock label="Presidente de la Asamblea" />
            <SignatureBlock label="Secretario(a)" />
            <SignatureBlock label="Administrador(a)" name={data.org.name} />
          </View>
        </View>

        {/* ── Footer ─────────────────────────────────────────────── */}
        <DocFooter
          docCode={`${data.assemblyNumber}-${docId(data.id)}`}
          generatedAt={fmtDate(new Date())}
          note="Acta oficial de asamblea de propietarios. Válida con firmas de todos los presentes."
        />
      </Page>
    </Document>
  )
}
