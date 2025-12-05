import { useEffect, useState } from 'react'
import * as api from '../services/api'
import styles from '../App.module.css'

const LIMIT = 5

export default function RecentActivity({ lang = 'pl' }) {
  const [orders, setOrders] = useState([])
  const [error, setError] = useState(null)

  const labels = lang === 'en'
    ? { title: 'Recent production events', empty: 'No activity recorded', order: 'Order' }
    : { title: 'Ostatnie zdarzenia produkcyjne', empty: 'Brak aktywności', order: 'Zlecenie' }

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getOrders()
        setOrders((data || []).slice(-LIMIT).reverse())
      } catch (err) {
        setError(err?.message || 'Failed to load')
      }
    }
    load()
  }, [])

  return (
    <section className={styles.recentActivitySection}>
      <h2>{labels.title}</h2>
      {error && <p className={styles.errorText}>{error}</p>}
      {orders.length === 0 && !error && (
        <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>{labels.empty}</p>
      )}
      <ul className={styles.activityList}>
        {orders.map((order) => (
          <li key={order.order_id} className={styles.activityItem}>
            <div className={styles.activityInfo}>
              <div className={styles.activityTitle}>{labels.order} #{order.order_id}</div>
              <div className={styles.activityMeta}>{order.product_name || '—'}</div>
            </div>
            <div className={styles.activityDate}>{order.status}</div>
          </li>
        ))}
      </ul>
    </section>
  )
}
