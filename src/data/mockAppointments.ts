import type { Appointment } from '../types/models'

export const mockAppointments: Appointment[] = [
  {
    id: 'a1',
    patientId: 'p1',
    patientName: 'Alex Rivera',
    date: '2026-05-14',
    time: '09:00',
    procedure: 'Prophylaxis (D1110)',
    notes: 'Routine recare',
  },
  {
    id: 'a2',
    patientId: 'p2',
    patientName: 'Jordan Lee',
    date: '2026-05-14',
    time: '10:30',
    procedure: 'Periodic oral evaluation (D0120)',
  },
  {
    id: 'a3',
    patientId: 'p3',
    patientName: 'Sam Patel',
    date: '2026-05-14',
    time: '13:15',
    procedure: 'Composite restoration (D2391)',
  },
  {
    id: 'a4',
    patientId: 'p5',
    patientName: 'Casey Nguyen',
    date: '2026-05-15',
    time: '08:45',
    procedure: 'Panoramic image (D0330)',
  },
  {
    id: 'a5',
    patientId: 'p7',
    patientName: 'Morgan Chen',
    date: '2026-05-15',
    time: '11:00',
    procedure: 'Scaling / root planing (D4341)',
  },
  {
    id: 'a6',
    patientId: 'p8',
    patientName: 'Jamie Okafor',
    date: '2026-05-16',
    time: '15:30',
    procedure: 'Crown prep (D2750)',
  },
]
