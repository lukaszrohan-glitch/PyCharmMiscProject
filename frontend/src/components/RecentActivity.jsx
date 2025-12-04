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
    <section className={styles.activityCard}>
      <header>
        <h2>{labels.title}</h2>
      </header>
      {error && <p className={styles.errorText}>{error}</p>}
      {orders.length === 0 && !error && (
        <p className={styles.muted}>{labels.empty}</p>
      )}
      <ul>
        {orders.map((order) => (
          <li key={order.order_id}>
            <strong>{labels.order} #{order.order_id}</strong>
            <span>{order.product_name || '—'}</span>
            <span>{order.status}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

