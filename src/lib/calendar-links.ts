/**
 * calendar-links — Generate "Add to Calendar" links for Google Calendar,
 * Outlook, and universal ICS download.
 *
 * Pattern: same as wa.me links — a URL that opens the user's calendar
 * with the event pre-filled. Zero OAuth, zero API keys, zero credentials.
 * Works with any calendar app.
 */

export interface CalendarEvent {
  title: string
  start: Date
  end?: Date
  description?: string
  location?: string
  url?: string
}

export interface CalendarLinks {
  google: string
  outlook: string
  ics: string
}

function fmtGoogle(d: Date): string {
  return d.toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z'
}

function fmtOutlook(d: Date): string {
  return d.toISOString().replace(/\.\d{3}Z$/, '')
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

/**
 * Generate Add-to-Calendar links for Google Calendar, Outlook, and ICS.
 */
export function calendarLinks(event: CalendarEvent): CalendarLinks {
  const start = event.start
  const end = event.end ?? new Date(start.getTime() + 60 * 60 * 1000)

  // Google Calendar URL
  const googleParams = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${fmtGoogle(start)}/${fmtGoogle(end)}`,
  })
  if (event.description) googleParams.set('details', event.description)
  if (event.location) googleParams.set('location', event.location)
  const google = `https://calendar.google.com/calendar/render?${googleParams.toString()}`

  // Outlook Calendar URL
  const outlookParams = new URLSearchParams({
    subject: event.title,
    startdt: fmtOutlook(start),
    enddt: fmtOutlook(end),
  })
  if (event.description) outlookParams.set('body', event.description)
  if (event.location) outlookParams.set('location', event.location)
  const outlook = `https://outlook.live.com/calendar/0/action/compose?${outlookParams.toString()}`

  // ICS file content (RFC 5545)
  const now = fmtGoogle(new Date())
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Aika Platform//Calendar Export//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    foldIcs(`UID:${uid()}@aika`),
    foldIcs(`DTSTAMP:${now}`),
    foldIcs(`DTSTART:${fmtGoogle(start)}`),
    foldIcs(`DTEND:${fmtGoogle(end)}`),
    foldIcs(`SUMMARY:${escapeIcs(event.title)}`),
  ]
  if (event.description) lines.push(foldIcs(`DESCRIPTION:${escapeIcs(event.description)}`))
  if (event.location) lines.push(foldIcs(`LOCATION:${escapeIcs(event.location)}`))
  if (event.url) lines.push(foldIcs(`URL:${event.url}`))
  lines.push('END:VEVENT', 'END:VCALENDAR')
  const ics = lines.join('\r\n')

  return { google, outlook, ics }
}

/**
 * Build a due-date reminder event (9am on the due date, 30-minute block).
 * Useful for payment reminders.
 */
export function dueDateEvent(opts: {
  title: string
  dueDate: Date
  description?: string
}): CalendarEvent {
  const start = new Date(opts.dueDate)
  start.setHours(9, 0, 0, 0)
  const end = new Date(opts.dueDate)
  end.setHours(9, 30, 0, 0)
  return { title: opts.title, start, end, description: opts.description }
}

/**
 * Client-side ICS file download — no server needed.
 * Creates a Blob URL, triggers download, then revokes it.
 */
export function downloadIcs(icsContent: string, filename = 'evento.ics'): void {
  if (typeof window === 'undefined') return
  const blob = new Blob([icsContent], { type: 'text/calendar; charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Build URL for the server-side ICS download endpoint.
 * Useful in emails where you need an absolute URL to share.
 * Endpoint: /api/condo-comms/calendar-ics
 */
export function calendarIcsUrl(event: CalendarEvent): string {
  const end = event.end ?? new Date(event.start.getTime() + 60 * 60 * 1000)
  const params = new URLSearchParams({
    title: event.title,
    start: event.start.toISOString(),
    end: end.toISOString(),
  })
  if (event.description) params.set('description', event.description)
  if (event.location) params.set('location', event.location)
  return `/api/condo-comms/calendar-ics?${params.toString()}`
}
