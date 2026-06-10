import type { SheetAuditEvent } from '../../types/sheet-audit'

/** In-browser audit log until Laura ships GET /api/sheet/audit. */
const events: SheetAuditEvent[] = [
  {
    id: 'audit-seed-1',
    rowIndex: 12,
    field: 'ivfStatus',
    previousValue: 'New',
    newValue: 'DONE B',
    username: 'admin@dco.test',
    editedAt: '2026-05-27T18:30:00.000Z',
  },
  {
    id: 'audit-seed-2',
    rowIndex: 12,
    field: 'notes',
    previousValue: 'CHART: 1042\nNO IVF 2026',
    newValue: 'CHART: 1042\nPID: 19000011174867\nSUB ID: 8821044\nIVF 2026 FOUND',
    username: 'admin@dco.test',
    editedAt: '2026-05-27T18:31:00.000Z',
  },
]

let nextId = events.length + 1

export function listStoredAuditEvents(query: {
  rowIndex?: number
  dateFrom?: string
  dateTo?: string
}): SheetAuditEvent[] {
  return events
    .filter((e) => {
      if (query.rowIndex != null && e.rowIndex !== query.rowIndex) return false
      if (query.dateFrom && e.editedAt.slice(0, 10) < query.dateFrom) return false
      if (query.dateTo && e.editedAt.slice(0, 10) > query.dateTo) return false
      return true
    })
    .sort((a, b) => b.editedAt.localeCompare(a.editedAt))
}

export function appendAuditEvent(
  event: Omit<SheetAuditEvent, 'id'>,
): SheetAuditEvent {
  const full: SheetAuditEvent = { ...event, id: `audit-${nextId++}` }
  events.unshift(full)
  return full
}
