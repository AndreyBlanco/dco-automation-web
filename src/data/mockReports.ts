import type { ReportRow } from '../types/models'

export const mockReports: ReportRow[] = [
  {
    id: 'r1',
    title: 'Weekly verifications — May 5–11, 2026',
    generatedAt: '2026-05-11T16:20:00',
    type: 'weekly',
  },
  {
    id: 'r2',
    title: 'Weekly verifications — Apr 28–May 4, 2026',
    generatedAt: '2026-05-04T15:02:00',
    type: 'weekly',
  },
  {
    id: 'r3',
    title: 'Custom: appointments by provider',
    generatedAt: '2026-04-29T09:45:00',
    type: 'custom',
  },
]
