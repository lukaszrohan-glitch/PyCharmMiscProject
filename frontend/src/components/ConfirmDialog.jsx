import {useEffect, useRef} from 'react';
import styles from './ConfirmDialog.module.css'

/**
 * Reusable confirmation dialog for destructive actions
 * Usage:
 *   <ConfirmDialog
 *     isOpen={showConfirm}
 *     onClose={() => setShowConfirm(false)}
 *     onConfirm={handleDelete}
 *     title="Czy na pewno?"
 *     message="Ta operacja jest nieodwracalna."
 *     confirmText="Usuń"
 *     cancelText="Anuluj"
 *     type="danger"
 *   />
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Potwierdź',
  message,
  confirmText = 'Tak',
  cancelText = 'Nie',
  type = 'default' // 'default' | 'danger' | 'warning'
}) {
  const cancelBtnRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return
    cancelBtnRef.current?.focus()
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  const handleCancel = () => {
    onClose()
  }

  return (
    <>
      <button
        type="button"
        className={styles.overlay}
        aria-label={title}
        onClick={onClose}
      />
      <div
        className={`${styles.dialog} ${styles[type]}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <h3 id="confirm-dialog-title" className={styles.title}>
          {title}
        </h3>

        {message && (
          <p className={styles.message}>{message}</p>
        )}

        <div className={styles.actions}>
          <button
            ref={cancelBtnRef}
            className={styles.cancelBtn}
            onClick={handleCancel}
          >
            {cancelText}
          </button>
          <button
            className={`${styles.confirmBtn} ${styles[`confirmBtn--${type}`]}`}
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </>
  )
}
