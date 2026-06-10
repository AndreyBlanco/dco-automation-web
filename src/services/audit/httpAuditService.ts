import type {
  SheetAuditQuery,
  SheetAuditResponse,
  SheetAuditService,
} from '../../types/sheet-audit'
import { authFetch, readApiErrorMessage } from '../auth/authFetch'

export class HttpAuditService implements SheetAuditService {
  private readonly baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  async listEvents(query: SheetAuditQuery): Promise<SheetAuditResponse> {
    const params = new URLSearchParams()
    if (query.rowIndex != null) params.set('rowIndex', String(query.rowIndex))
    if (query.dateFrom) params.set('dateFrom', query.dateFrom)
    if (query.dateTo) params.set('dateTo', query.dateTo)

    const qs = params.toString()
    const res = await authFetch(
      `${this.baseUrl.replace(/\/$/, '')}/api/sheet/audit${qs ? `?${qs}` : ''}`,
    )

    if (!res.ok) {
      throw new Error(await readApiErrorMessage(res, 'Failed to load audit history'))
    }

    return res.json() as Promise<SheetAuditResponse>
  }
}
