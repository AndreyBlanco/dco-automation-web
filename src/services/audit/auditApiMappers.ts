import type { SheetAuditEvent, SheetAuditField, SheetRowLastEdit } from '../../types/sheet-audit'

/** Laura API payload (`api/app/audit_store.py` + `SheetAuditResponse`). */
export type LauraSheetAuditEntry = {
  id: number
  createdAt: string
  username: string
  rowIndex: number
  before: Record<string, unknown>
  after: Record<string, unknown>
}

export type LauraSheetAuditResponse = {
  entries: LauraSheetAuditEntry[]
}

const AUDIT_FIELDS: SheetAuditField[] = ['ivfStatus', 'notes']

export function mapLauraAuditResponse(raw: LauraSheetAuditResponse): {
  events: SheetAuditEvent[]
  latestEditsByRowIndex: Map<number, SheetRowLastEdit>
} {
  const events: SheetAuditEvent[] = []
  const latestEditsByRowIndex = new Map<number, SheetRowLastEdit>()

  for (const entry of raw.entries) {
    if (!latestEditsByRowIndex.has(entry.rowIndex)) {
      latestEditsByRowIndex.set(entry.rowIndex, {
        username: entry.username,
        editedAt: entry.createdAt,
      })
    }

    for (const field of AUDIT_FIELDS) {
      const beforeValue = entry.before[field]
      const afterValue = entry.after[field]
      if (beforeValue === afterValue) continue
      if (beforeValue === undefined && afterValue === undefined) continue

      events.push({
        id: `${entry.id}-${field}`,
        rowIndex: entry.rowIndex,
        field,
        previousValue: stringifyAuditValue(beforeValue),
        newValue: stringifyAuditValue(afterValue),
        username: entry.username,
        editedAt: entry.createdAt,
      })
    }
  }

  return { events, latestEditsByRowIndex }
}

export function latestEditsFromEvents(events: SheetAuditEvent[]): Map<number, SheetRowLastEdit> {
  const map = new Map<number, SheetRowLastEdit>()
  for (const event of events) {
    if (map.has(event.rowIndex)) continue
    map.set(event.rowIndex, {
      username: event.username,
      editedAt: event.editedAt,
    })
  }
  return map
}

function stringifyAuditValue(value: unknown): string {
  if (value == null) return ''
  return String(value)
}
