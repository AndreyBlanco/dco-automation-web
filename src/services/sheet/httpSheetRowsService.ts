import type {
  SheetRowPatch,
  SheetRowPatchResponse,
  SheetRowsQuery,
  SheetRowsResponse,
  SheetRowsService,
} from '../../types/sheet-api'

import { readStoredToken } from '../auth/authStorage'

export class HttpSheetRowsService implements SheetRowsService {
  private readonly baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private url(path: string): string {
    return `${this.baseUrl.replace(/\/$/, '')}${path}`
  }

  private authHeaders(): HeadersInit {
    const token = readStoredToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
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

    const res = await fetch(
      `${this.url('/api/sheet/rows')}${qs ? `?${qs}` : ''}`,
      {
        headers: this.authHeaders(),
      },
    )

    if (!res.ok) {
      throw new Error(`Failed to load sheet rows (${res.status})`)
    }

    return res.json() as Promise<SheetRowsResponse>
  }

  async patchRow(patch: SheetRowPatch): Promise<SheetRowPatchResponse> {
    const res = await fetch(this.url('/api/sheet/row'), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...this.authHeaders(),
      },
      body: JSON.stringify(patch),
    })

    if (!res.ok) {
      throw new Error(`Failed to update row (${res.status})`)
    }

    return res.json() as Promise<SheetRowPatchResponse>
  }
}