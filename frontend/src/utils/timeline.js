export function detectConflicts(orders) {
  const conflicts = []
  const sorted = orders.slice().sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i]
    for (let j = i + 1; j < sorted.length; j++) {
      const next = sorted[j]
      if (new Date(next.start_date) <= new Date(current.due_date || current.start_date)) {
        conflicts.push([current.order_id, next.order_id])
      } else {
        break
      }
    }
  }
  return conflicts
}

