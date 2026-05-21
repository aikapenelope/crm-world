/**
 * Generic ICS calendar file download endpoint.
 * Returns a downloadable .ics file compatible with Apple Calendar,
 * Thunderbird, Outlook desktop, and any RFC 5545-compliant app.
 * No authentication required — only public event metadata is exposed.
 *
 * Usage: /api/condo-comms/calendar-ics?title=Asamblea&start=2026-06-15T19:00:00Z&end=2026-06-15T21:00:00Z
 */
export const metadata = {
  GET: { requireAuth: false },
}

function fmtIcs(d: Date): string {
  return d.toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z'
}

function escapeIcs(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n')
}

function foldIcs(line: string): string {
  if (line.length <= 75) return line
  const chunks: string[] = []
  while (line.length > 75) {
    chunks.push(line.slice(0, 75))
    line = ' ' + line.slice(75)
  }
  chunks.push(line)
  return chunks.join('\r\n')
}

function uid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const title = url.searchParams.get('title')
  const startStr = url.searchParams.get('start')
  const endStr = url.searchParams.get('end')
  const description = url.searchParams.get('description')
  const location = url.searchParams.get('location')

  if (!title || !startStr) {
    return Response.json({ error: 'title and start are required' }, { status: 400 })
  }

  const start = new Date(startStr)
  if (isNaN(start.getTime())) {
    return Response.json({ error: 'Invalid start date' }, { status: 400 })
  }
  const end = endStr ? new Date(endStr) : new Date(start.getTime() + 60 * 60 * 1000)

  const now = fmtIcs(new Date())
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Aika Platform//Calendar Export//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    foldIcs(`UID:${uid()}@aika`),
    foldIcs(`DTSTAMP:${now}`),
    foldIcs(`DTSTART:${fmtIcs(start)}`),
    foldIcs(`DTEND:${fmtIcs(end)}`),
    foldIcs(`SUMMARY:${escapeIcs(title)}`),
  ]
  if (description) lines.push(foldIcs(`DESCRIPTION:${escapeIcs(description)}`))
  if (location) lines.push(foldIcs(`LOCATION:${escapeIcs(location)}`))
  lines.push('END:VEVENT', 'END:VCALENDAR')

  const filename = title.replace(/[^a-z0-9\-_ ]/gi, '').trim().replace(/\s+/g, '-').toLowerCase()

  return new Response(lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename || 'evento'}.ics"`,
      'Cache-Control': 'no-store',
    },
  })
}

export const openApi = {}
