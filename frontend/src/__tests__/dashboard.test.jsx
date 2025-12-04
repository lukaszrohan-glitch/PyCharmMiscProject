import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Dashboard from '../components/Dashboard'

vi.mock('../services/api', () => ({
  getOrders: vi.fn().mockResolvedValue([]),
  getInventory: vi.fn().mockResolvedValue([])
}))

vi.mock('../i18n', () => ({
  useI18n: () => ({ t: (key) => key })
}))

vi.mock('../App.module.css', () => ({ default: new Proxy({}, { get: (_, prop) => prop }) }))

vi.mock('../components/ProductionHealth', () => ({ default: () => <div data-testid="health" /> }))
vi.mock('../components/RecentActivity', () => ({ default: () => <div data-testid="activity" /> }))

describe('Dashboard', () => {
  it('renders nav tiles and analytics widgets', () => {
    render(<Dashboard lang="en" setCurrentView={() => {}} />)
    expect(screen.getByTestId('health')).toBeInTheDocument()
    expect(screen.getByTestId('activity')).toBeInTheDocument()
    expect(screen.getAllByRole('button').length).toBeGreaterThan(2)
  })
})
