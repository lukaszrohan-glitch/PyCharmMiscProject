export default function ShortcutsModal({ lang = 'pl', onClose }) {
  const t = lang === 'pl' ? {
    title: 'Skróty klawiaturowe',
    search: 'Skup wyszukiwanie',
    help: 'Pokaż skróty',
    esc: 'Zamknij',
  } : {
    title: 'Keyboard Shortcuts',
    search: 'Focus search',
    help: 'Show shortcuts',
    esc: 'Close',
  }
  return (
    <>
      <button
        type="button"
        className="modal-overlay"
        aria-label="Close shortcuts"
        onClick={onClose}
      />
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="shortcuts-title">
        <div className="modal-header">
          <h3 id="shortcuts-title">{lang==='pl'?'Skróty i dokumentacja':'Shortcuts & Docs'}</h3>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close">×</button>
        </div>
        <ul style={{listStyle:'none', padding:0, margin:0, display:'grid', gap:8}}>
          <li><kbd>/</kbd> — {t.search}</li>
          <li><kbd>?</kbd> — {t.help}</li>
          <li><kbd>Esc</kbd> — {t.esc}</li>
        </ul>
      </div>
      <style>{`
        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:100}
        .modal-content{background:var(--background,#fff);color:var(--text,#111);border:1px solid var(--border,#ddd);border-radius:12px;max-width:420px;width:100%;padding:16px;box-shadow:0 24px 60px rgba(0,0,0,.2)}
        .modal-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
        .modal-title{font-weight:700}
        .close-btn{background:transparent;border:1px solid var(--border,#ddd);width:28px;height:28px;border-radius:8px}
        kbd{background:#111;color:#fff;border-radius:6px;padding:2px 6px;margin-right:6px}
      `}</style>
    </>
  )
}
