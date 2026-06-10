import type {
  SheetRowPatch,
  SheetRowPatchResponse,
  SheetRowsQuery,
  SheetRowsResponse,
  SheetRowsService,
} from '../../types/sheet-api'
import { authFetch, readApiErrorMessage } from '../auth/authFetch'

export class HttpSheetRowsService implements SheetRowsService {
  private readonly baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private url(path: string): string {
    return `${this.baseUrl.replace(/\/$/, '')}${path}`
  }

  async listRows(query: SheetRowsQuery): Promise<SheetRowsResponse> {
    const params = new URLSearchParams()
    if (query.date) params.set('date', query.date)
    if (query.dateFrom) params.set('dateFrom', query.dateFrom)
    if (query.dateTo) params.set('dateTo', query.dateTo)
    if (query.ivfStatus) params.set('ivfStatus', query.ivfStatus)
    if (query.kindOfInsurance) params.set('kindOfInsurance', query.kindOfInsurance)
    if (query.q) params.set('q', query.q)

    const qs = params.toString()

    const res = await authFetch(`${this.url('/api/sheet/rows')}${qs ? `?${qs}` : ''}`)

    if (!res.ok) {
      throw new Error(await readApiErrorMessage(res, 'Failed to load sheet rows'))
    }

    return res.json() as Promise<SheetRowsResponse>
  }

  async patchRow(patch: SheetRowPatch): Promise<SheetRowPatchResponse> {
    const res = await authFetch(this.url('/api/sheet/row'), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })

    if (!res.ok) {
      throw new Error(await readApiErrorMessage(res, 'Failed to update row'))
    }

    return res.json() as Promise<SheetRowPatchResponse>
  }
}
