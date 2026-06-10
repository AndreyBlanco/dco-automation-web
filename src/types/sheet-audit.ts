/** Field names allowed in sheet audit events (columns E and J only). */
export type SheetAuditField = 'ivfStatus' | 'notes'

export interface SheetRowLastEdit {
  username: string
  editedAt: string
}

export interface SheetAuditEvent {
  id: string
  rowIndex: number
  field: SheetAuditField
  previousValue: string
  newValue: string
  username: string
  editedAt: string
}

export interface SheetAuditQuery {
  rowIndex?: number
  dateFrom?: string
  dateTo?: string
}

export interface SheetAuditResponse {
  events: SheetAuditEvent[]
}

export interface SheetAuditService {
  listEvents(query: SheetAuditQuery): Promise<SheetAuditResponse>
}
