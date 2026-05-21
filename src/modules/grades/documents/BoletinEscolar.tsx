/**
 * Boletín Escolar — PDF Document
 * Professional school report card with grades by subject and period.
 */
// @ts-ignore
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import * as React from 'react'
import {
  COLORS, FONTS, FONT_SIZES, SPACING, PAGE,
  type OrgBranding, fmtDate, docId,
} from '../../../lib/pdf/design'
import {
  baseStyles, DocHeader, Section, DocFooter,
} from '../../../lib/pdf/components'

// ─── Types ────────────────────────────────────────────────────────────────────

export type BoletinPeriod = {
  name: string
  period_number: number
}

export type BoletinSubjectGrade = {
  subject_name: string
  subject_code: string
  is_qualitative: boolean
  // Score per period (index = period_number - 1)
  scores: (string | null)[]
  observations: string | null
}

export type BoletinPDFData = {
  org: OrgBranding
  schoolYear: string
  studentName: string
  gradeLabel: string
  section: string
  periods: BoletinPeriod[]
  subjects: BoletinSubjectGrade[]
  attendanceSummary: {
    total_days: number
    present_days: number
    absent_days: number
    late_days: number
  } | null
  id: string
}

// ─── Grade display helpers ────────────────────────────────────────────────────

function fmtScore(score: string | null, isQualitative: boolean): string {
  if (!score) return '—'
  if (isQualitative) return score
  const num = parseFloat(score)
  if (isNaN(num)) return score
  return num.toFixed(1)
}

function scoreColor(score: string | null, isQualitative: boolean): string {
  if (!score || isQualitative) return COLORS.text
  const num = parseFloat(score)
  if (isNaN(num)) return COLORS.text
  if (num >= 18) return '#059669'  // Excellent (emerald)
  if (num >= 14) return '#2563eb'  // Good (blue)
  if (num >= 10) return COLORS.text // Passing
  return COLORS.danger              // Failing
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  studentCard: {
    backgroundColor: COLORS.primaryFade,
    borderRadius: 8,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    marginBottom: SPACING.lg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primaryLight,
  },
  studentInitial: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentInitialText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
  },
  gradeTableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: 7,
    paddingHorizontal: 8,
  },
  gradeRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
  },
  gradeRowAlt: {
    backgroundColor: COLORS.gray50,
  },
  gradeHeaderText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  gradeCellSubject: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.body,
    color: COLORS.text,
  },
  gradeCellScore: {
    width: 40,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.bold,
    textAlign: 'center',
  },
  gradeCellObs: {
    width: 120,
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.body,
    color: COLORS.textMuted,
  },
  attendanceRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  attendancePill: {
    flex: 1,
    borderRadius: 6,
    padding: SPACING.sm,
    alignItems: 'center',
  },
  attendancePillNumber: {
    fontSize: FONT_SIZES['2xl'],
    fontFamily: FONTS.bold,
    lineHeight: 1.2,
  },
  attendancePillLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.body,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
})

// ─── Document ─────────────────────────────────────────────────────────────────

export function BoletinEscolar({ data }: { data: BoletinPDFData }) {
  const initials = data.studentName
    .split(' ').slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase()

  return (
    <Document
      title={`Boletín — ${data.studentName}`}
      author={data.org.name}
      subject={`Boletín Escolar ${data.schoolYear}`}
      creator="Aika Platform"
    >
      <Page size={PAGE.size} style={baseStyles.page}>
        {/* ── Header ─────────────────────────────────────────────── */}
        <DocHeader
          org={data.org}
          docTitle="Boletín de Calificaciones"
          docNumber={data.schoolYear}
          accentColor="#1a2a3a"
        />

        {/* ── Content ────────────────────────────────────────────── */}
        <View style={baseStyles.content}>

          {/* Student card */}
          <View style={styles.studentCard}>
            <View style={styles.studentInitial}>
              <Text style={styles.studentInitialText}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: FONT_SIZES['2xl'], fontFamily: FONTS.bold, color: COLORS.primary }}>
                {data.studentName}
              </Text>
              <Text style={{ fontSize: FONT_SIZES.md, color: COLORS.textMuted, marginTop: 2 }}>
                {data.gradeLabel} — Sección {data.section}  ·  Año escolar {data.schoolYear}
              </Text>
            </View>
          </View>

          {/* Grades table */}
          <Section title="Calificaciones">
            <View style={{ borderWidth: 0.5, borderColor: COLORS.border, borderRadius: 4, overflow: 'hidden' }}>
              {/* Header row */}
              <View style={styles.gradeTableHeader}>
                <Text style={[styles.gradeHeaderText, { flex: 1, textAlign: 'left' }]}>Asignatura</Text>
                {data.periods.map((p, idx) => (
                  <Text key={idx} style={[styles.gradeHeaderText, { width: 40 }]}>
                    {p.name.length > 4 ? `P${p.period_number}` : p.name}
                  </Text>
                ))}
                <Text style={[styles.gradeHeaderText, { width: 120, textAlign: 'left' }]}>Observaciones</Text>
              </View>

              {/* Subject rows */}
              {data.subjects.map((sub, idx) => (
                <View key={idx} style={[styles.gradeRow, idx % 2 === 1 ? styles.gradeRowAlt : {}]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.gradeCellSubject}>{sub.subject_name}</Text>
                    <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.textMuted }}>{sub.subject_code}</Text>
                  </View>
                  {data.periods.map((p, pi) => {
                    const score = sub.scores[pi] ?? null
                    return (
                      <Text
                        key={pi}
                        style={[styles.gradeCellScore, { color: scoreColor(score, sub.is_qualitative) }]}
                      >
                        {fmtScore(score, sub.is_qualitative)}
                      </Text>
                    )
                  })}
                  <Text style={styles.gradeCellObs} numberOfLines={2}>
                    {sub.observations ?? ''}
                  </Text>
                </View>
              ))}
            </View>

            {/* Score legend */}
            <View style={{ flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.sm }}>
              {[
                { range: '18-20', label: 'Sobresaliente', color: '#059669' },
                { range: '14-17', label: 'Bueno', color: '#2563eb' },
                { range: '10-13', label: 'Aprobado', color: COLORS.text },
                { range: '< 10', label: 'Reprobado', color: COLORS.danger },
              ].map((item, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: item.color }} />
                  <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.textMuted }}>
                    {item.range}: {item.label}
                  </Text>
                </View>
              ))}
            </View>
          </Section>

          {/* Attendance */}
          {data.attendanceSummary && (
            <Section title="Asistencia">
              <View style={styles.attendanceRow}>
                {[
                  { n: data.attendanceSummary.present_days, label: 'Asistencias', color: '#059669', bg: '#ecfdf5' },
                  { n: data.attendanceSummary.late_days, label: 'Tardanzas', color: '#d97706', bg: '#fffbeb' },
                  { n: data.attendanceSummary.absent_days, label: 'Inasistencias', color: '#dc2626', bg: '#fef2f2' },
                  { n: data.attendanceSummary.total_days, label: 'Días totales', color: COLORS.primary, bg: COLORS.primaryFade },
                ].map((item, i) => (
                  <View key={i} style={[styles.attendancePill, { backgroundColor: item.bg }]}>
                    <Text style={[styles.attendancePillNumber, { color: item.color }]}>{item.n}</Text>
                    <Text style={styles.attendancePillLabel}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </Section>
          )}

          {/* Signature */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.xl }}>
            <View style={{
              width: '35%', borderTopWidth: 1, borderTopColor: COLORS.gray300,
              paddingTop: 6, alignItems: 'center', marginTop: 32,
            }}>
              <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.textMuted }}>Director / Directora</Text>
            </View>
            <View style={{
              width: '35%', borderTopWidth: 1, borderTopColor: COLORS.gray300,
              paddingTop: 6, alignItems: 'center', marginTop: 32,
            }}>
              <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.textMuted }}>Sello de la Institución</Text>
            </View>
          </View>
        </View>

        {/* ── Footer ─────────────────────────────────────────────── */}
        <DocFooter
          docCode={docId(data.id)}
          generatedAt={fmtDate(new Date())}
          note="Este boletín es un documento oficial emitido por la institución educativa."
        />
      </Page>
    </Document>
  )
}
