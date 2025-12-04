import { useEffect, useMemo, useState } from 'react'
import * as api from '../services/api'
import styles from '../App.module.css'

const formatPct = (value = 0) => `${Math.min(100, Math.max(0, Math.round(value)))}%`

export default function ProductionHealth({ lang = 'pl' }) {
  const [orders, setOrders] = useState([])
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const labels = useMemo(() => ({
    pl: {
      title: 'Zdrowie produkcji',
      inProgress: 'W realizacji',
      late: 'Spóźnione',
      avgProgress: 'Średni postęp',
      stockCoverage: 'Pokrycie magazynowe',
      refresh: 'Odśwież'
    },
    en: {
      title: 'Production health',
      inProgress: 'In production',
      late: 'Late orders',
      avgProgress: 'Avg. progress',
      stockCoverage: 'Stock coverage',
      refresh: 'Refresh'
    }
  }), [])

  const l = lang === 'en' ? labels.en : labels.pl

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const [ordersData, inventoryData] = await Promise.all([
        api.getOrders(),
        api.getInventory()
      ])
      setOrders(ordersData)
      setInventory(inventoryData)
    } catch (err) {
      console.error('Production health load failed:', err)
      setError(err?.message || 'Nie udało się pobrać danych produkcyjnych')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const stats = useMemo(() => {
    if (!orders.length) {
      return { inProd: 0, late: 0, avgProgress: 0, coverage: 0 }
    }
    const inProd = orders.filter(o => o.status === 'InProd').length
    const late = orders.filter(o => {
      if (!o.due_date) return false
      return new Date(o.due_date) < new Date() && o.status !== 'Done'
    }).length
    const avgProgress = orders.reduce((acc, o) => acc + Number(o.progress || 0), 0) / orders.length
    const stockValue = inventory.reduce((acc, item) => acc + (item.quantity_on_hand || 0), 0)
    const coverage = stockValue ? Math.min(100, (stockValue / (orders.length * 10)) * 100) : 0
    return { inProd, late, avgProgress, coverage }
  }, [orders, inventory])

  return (
    <section className={styles.healthCard} aria-live="polite">
      <header>
        <h2>{l.title}</h2>
        <button type="button" onClick={load} disabled={loading}>
          {l.refresh}
        </button>
      </header>
      {error && (
        <p className={styles.errorText} role="alert">
          {lang === 'en'
            ? `Unable to fetch production metrics. ${error}`
            : `Nie udało się odświeżyć zdrowia produkcji. ${error}`}
        </p>
      )}
      <div className={styles.healthGrid}>
        <div>
          <span className={styles.healthLabel}>{l.inProgress}</span>
          <strong className={styles.healthValue}>{stats.inProd}</strong>
        </div>
        <div>
          <span className={styles.healthLabel}>{l.late}</span>
          <strong className={styles.healthValue}>{stats.late}</strong>
        </div>
        <div>
          <span className={styles.healthLabel}>{l.avgProgress}</span>
          <strong className={styles.healthValue}>{formatPct(stats.avgProgress)}</strong>
        </div>
        <div>
          <span className={styles.healthLabel}>{l.stockCoverage}</span>
          <strong className={styles.healthValue}>{formatPct(stats.coverage)}</strong>
        </div>
      </div>
    </section>
  )
}
