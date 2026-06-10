import type {
  SheetAuditQuery,
  SheetAuditResponse,
  SheetAuditService,
} from '../../types/sheet-audit'
import { listStoredAuditEvents } from './auditStore'

export class MockAuditService implements SheetAuditService {
  async listEvents(query: SheetAuditQuery): Promise<SheetAuditResponse> {
    await delay(120)
    return { events: listStoredAuditEvents(query) }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}
