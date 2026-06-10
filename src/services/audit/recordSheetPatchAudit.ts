import type { SheetRowPatch } from '../../types/sheet-row'
import type { SheetRow } from '../../types/sheet-row'
import type { SheetRowLastEdit } from '../../types/sheet-audit'
import { appendAuditEvent } from './auditStore'

export function recordMockPatchAudit(
  previous: SheetRow,
  patch: SheetRowPatch,
  username: string,
): SheetRowLastEdit {
  const editedAt = new Date().toISOString()

  if (patch.ivfStatus != null && patch.ivfStatus !== previous.ivfStatus) {
    appendAuditEvent({
      rowIndex: patch.rowIndex,
      field: 'ivfStatus',
      previousValue: previous.ivfStatus,
      newValue: patch.ivfStatus,
      username,
      editedAt,
    })
  }

  const nextNotes = patch.notes ?? previous.notes
  if (patch.notes != null && patch.notes !== previous.notes) {
    appendAuditEvent({
      rowIndex: patch.rowIndex,
      field: 'notes',
      previousValue: previous.notes,
      newValue: nextNotes,
      username,
      editedAt,
    })
  }

  return { username, editedAt }
}
