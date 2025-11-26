
const statusColors = {
  'New': 'status-new',
  'Nowe': 'status-new',
  'Planned': 'status-planned',
  'Planowane': 'status-planned',
  'InProd': 'status-inprod',
  'W produkcji': 'status-inprod',
  'Done': 'status-done',
  'Gotowe': 'status-done',
  'Invoiced': 'status-invoiced',
  'Zafakturowane': 'status-invoiced'
}

export default function StatusBadge({ status }) {
  const className = statusColors[status] || 'status-new'
  return (
    <span className={`status-badge ${className}`}>
      {status}
    </span>
  )
}

