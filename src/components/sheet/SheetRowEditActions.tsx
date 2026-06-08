import { useState } from 'react'
import { Button } from '../ui/Button'
import type { IvfStatus, SheetRow } from '../../types/sheet-row'
import styles from './SheetRowEditActions.module.css'

const STATUS_OPTIONS: IvfStatus[] = ['New', 'DONE B']
const NOTES_MAX_LENGTH = 2000

interface SheetRowEditActionsProps {
  row: SheetRow
  canEdit: boolean
  disabled?: boolean
  onSave: (patch: { rowIndex: number; ivfStatus: IvfStatus; notes: string }) => Promise<void>
}

export function SheetRowEditActions({ row, canEdit, disabled, onSave }: SheetRowEditActionsProps) {
  const [editing, setEditing] = useState(false)
  const [ivfStatus, setIvfStatus] = useState<IvfStatus>(row.ivfStatus)
  const [notes, setNotes] = useState(row.notes)
  const [saving, setSaving] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  if (row.rowIndex == null) {
    return <span className={styles.muted}>—</span>
  }

  if (!canEdit) {
    return <span className={styles.muted} title="Enable VITE_SHEET_USE_API for edits">—</span>
  }

  function startEdit() {
    setIvfStatus(row.ivfStatus)
    setNotes(row.notes)
    setLocalError(null)
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
    setLocalError(null)
  }

  function validate(): string | null {
    if (!STATUS_OPTIONS.includes(ivfStatus)) {
      return 'Status must be New or DONE B.'
    }
    if (notes.length > NOTES_MAX_LENGTH) {
      return `Notes must be ${NOTES_MAX_LENGTH} characters or fewer.`
    }
    return null
  }

  async function handleSave() {
    const validationError = validate()
    if (validationError) {
      setLocalError(validationError)
      return
    }

    setSaving(true)
    setLocalError(null)
    try {
      await onSave({
        rowIndex: row.rowIndex!,
        ivfStatus,
        notes: notes.trim(),
      })
      setEditing(false)
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : 'Could not save row.')
    } finally {
      setSaving(false)
    }
  }

  if (!editing) {
    return (
      <Button type="button" variant="secondary" size="sm" onClick={startEdit} disabled={disabled}>
        Edit
      </Button>
    )
  }

  return (
    <div className={styles.editor}>
      <label className={styles.label}>
        Status
        <select
          className={styles.select}
          value={ivfStatus}
          onChange={(e) => setIvfStatus(e.target.value as IvfStatus)}
          disabled={saving}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <label className={styles.label}>
        Notes (col J)
        <textarea
          className={styles.textarea}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          maxLength={NOTES_MAX_LENGTH}
          disabled={saving}
          aria-invalid={notes.length > NOTES_MAX_LENGTH}
        />
        <span className={styles.charCount}>
          {notes.length}/{NOTES_MAX_LENGTH}
        </span>
      </label>
      <div className={styles.btnRow}>
        <Button type="button" variant="primary" size="sm" onClick={() => void handleSave()} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={cancelEdit} disabled={saving}>
          Cancel
        </Button>
      </div>
      {localError && <p className={styles.err}>{localError}</p>}
    </div>
  )
}
