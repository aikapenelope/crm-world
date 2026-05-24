/**
 * API route: Generate assembly minutes PDF
 * GET /api/condo-comms/acta-pdf?id=ASSEMBLY_ID
 */
// @ts-ignore
import { renderToStream } from '@react-pdf/renderer'
import * as React from 'react'
import { ActaAsamblea, type ActaAsambleaPDFData, type VoteResult } from '../../documents/ActaAsamblea'
import { loadOrgBranding } from '@/lib/pdf/org-branding'

export const metadata = {
  GET: { requireAuth: true, requireFeatures: ['condo_comms.view'] },
}

export async function GET(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()
  const url = new URL(request.url)
  const id = url.searchParams.get('id')

  if (!id) return Response.json({ error: 'id is required' }, { status: 400 })

  const assembly = await kysely.selectFrom('condo_assemblies').selectAll()
    .where('id', '=', id)
    .where('tenant_id', '=', scope.tenantId)
    .executeTakeFirst()

  if (!assembly) return Response.json({ error: 'Assembly not found' }, { status: 404 })
  const a = assembly as any

  // Load building name
  const building = await kysely.selectFrom('condo_buildings').select(['name'])
    .where('id', '=', a.building_id).executeTakeFirst()

  // Load related votes for this building (closed votes near the assembly date)
  const votes = await kysely.selectFrom('condo_votes').selectAll()
    .where('building_id', '=', a.building_id)
    .where('tenant_id', '=', scope.tenantId)
    .where('status', '=', 'closed')
    .orderBy('created_at', 'desc')
    .limit(10)
    .execute()

  // Build vote results
  const voteResults: VoteResult[] = await Promise.all(
    (votes as any[]).map(async (v: any) => {
      // Get vote casts to tally results by choice with aliquot weights
      const casts = await kysely.selectFrom('condo_vote_casts')
        .select(['choice', 'aliquot_weight'])
        .where('vote_id', '=', v.id)
        .execute()

      const resultMap: Record<string, number> = {}
      const options: string[] = Array.isArray(v.options) ? v.options : ['Sí', 'No', 'Abstención']

      for (const opt of options) {
        resultMap[opt] = 0
      }
      for (const cast of casts as any[]) {
        const key = cast.choice
        resultMap[key] = (resultMap[key] ?? 0) + parseFloat(cast.aliquot_weight)
      }

      return {
        title: v.title,
        vote_type: v.vote_type,
        total_votes: v.total_votes,
        total_aliquot_voted: v.total_aliquot_voted,
        quorum_percent: v.quorum_percent,
        quorum_reached: parseFloat(v.total_aliquot_voted) >= parseFloat(v.quorum_percent),
        options,
        results: Object.keys(resultMap).length > 0 ? resultMap : null,
      }
    })
  )

  const org = await loadOrgBranding(kysely, scope)

  const data: ActaAsambleaPDFData = {
    org,
    buildingName: (building as any)?.name ?? 'Edificio',
    assemblyNumber: a.assembly_number,
    assemblyType: a.assembly_type,
    title: a.title,
    date: a.date,
    startTime: a.start_time ?? null,
    endTime: a.end_time ?? null,
    location: a.location ?? null,
    attendeesCount: a.attendees_count ?? 0,
    quorumPresent: a.quorum_present ?? null,
    agenda: Array.isArray(a.agenda) ? a.agenda : null,
    minutes: a.minutes ?? null,
    decisions: Array.isArray(a.decisions) ? a.decisions : null,
    votes: voteResults,
    id: a.id,
  }

  const stream = await renderToStream(React.createElement(ActaAsamblea, { data }))
  const chunks: Buffer[] = []
  for await (const chunk of stream) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  const pdfBuffer = Buffer.concat(chunks)
  const filename = `acta-${data.assemblyNumber.replace(/[^a-zA-Z0-9-]/g, '-')}.pdf`

  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(pdfBuffer.length),
      'Cache-Control': 'no-cache',
    },
  })
}

export const openApi = {}
