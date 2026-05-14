import {
  CalendarPlus,
  ClipboardCheck,
  FileBarChart2,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { LogoMark } from '../brand/LogoMark'
import styles from './Sidebar.module.css'

export function Sidebar() {
  const navigate = useNavigate()

  return (
    <div className={styles.root}>
      <div className={styles.sidebarBrand}>
        <LogoMark size={200} />
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.actionBtn}
          onClick={() => navigate('/appointments')}
        >
          <CalendarPlus size={18} aria-hidden />
          New Appointment
        </button>
        <button
          type="button"
          className={styles.actionBtn}
          onClick={() => navigate('/patients')}
        >
          <ClipboardCheck size={18} aria-hidden />
          Insurance Verification
        </button>
        <button
          type="button"
          className={styles.actionBtn}
          onClick={() => navigate('/reports')}
        >
          <FileBarChart2 size={18} aria-hidden />
          Generate Report
        </button>
      </div>

      <p className={styles.footer}>
        Demo UI — no live insurance data. Replace services when wiring the Python backend.
      </p>
    </div>
  )
}
