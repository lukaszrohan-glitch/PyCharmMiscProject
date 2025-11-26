import { useEffect } from 'react'
import classNames from 'classnames'

export default function ModalOverlay({
  children,
  onClose,
  ariaLabel = 'Close overlay',
  className,
  closeOnEsc = true,
  ...buttonProps
}) {
  useEffect(() => {
    if (!closeOnEsc) return undefined
    const handleKey = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose?.(event)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [closeOnEsc, onClose])

  const handleClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose?.(event)
    }
  }

  return (
    <div
      role="presentation"
      className={classNames('modal-overlay', className)}
      onClick={handleClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          handleClick(event)
        }
      }}
      tabIndex={-1}
    >
      <div className="modal-overlay-inner" role="dialog" aria-modal="true" aria-label={ariaLabel} {...buttonProps}>
        {children}
      </div>
    </div>
  )
}
