import { describe, expect, it } from 'vitest'
import { detectConflicts } from '../utils/timeline'

describe('detectConflicts', () => {
  it('detects overlapping orders', () => {
    const orders = [
      { order_id: 'A', start_date: '2025-12-01', due_date: '2025-12-05' },
      { order_id: 'B', start_date: '2025-12-03', due_date: '2025-12-06' },
      { order_id: 'C', start_date: '2025-12-07', due_date: '2025-12-08' }
    ]
    expect(detectConflicts(orders)).toEqual([
      ['A', 'B']
    ])
  })
})

