import { useState, useEffect, useMemo, useCallback } from 'react'
import * as api from '../services/api'
import { useI18n } from '../i18n'
import { useToast } from '../lib/toastContext'
import ModalOverlay from './ModalOverlay'
import LoadingSpinner from './LoadingSpinner'
import styles from './Production.module.css'

export default function Production() {
  const { t } = useI18n()
  const { addToast } = useToast()
  const [orders, setOrders] = useState([])
  const [_products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('schedule') // schedule, bom, capacity
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showBomModal, setShowBomModal] = useState(false)
  const [bomData, setBomData] = useState([])

  const labels = useMemo(() => ({
    pl: {
      title: 'Planowanie produkcji',
      schedule: 'Harmonogram',
      bom: 'Receptury (BOM)',
      capacity: 'Wykorzystanie mocy',
      orderId: 'Nr zlecenia',
      product: 'Produkt',
      quantity: 'Ilość',
      status: 'Status',
      startDate: 'Data rozpoczęcia',
      endDate: 'Data zakończenia',
      priority: 'Priorytet',
      machine: 'Maszyna/Stanowisko',
      progress: 'Postęp',
      viewBom: 'Zobacz recepturę',
      materials: 'Materiały',
      operations: 'Operacje',
      materialCode: 'Kod materiału',
      materialName: 'Nazwa',
      requiredQty: 'Ilość potrzebna',
      availableQty: 'Ilość dostępna',
      missingQty: 'Brakuje',
      operationNo: 'Nr operacji',
      operationName: 'Operacja',
      workCenter: 'Stanowisko',
      setupTime: 'Czas przezbrojen',
      runTime: 'Czas cyklu',
      totalTime: 'Czas całkowity',
      close: 'Zamknij',
      high: 'Wysoki',
      medium: 'Średni',
      low: 'Niski',
      new: 'Nowe',
      planned: 'Zaplanowane',
      inProgress: 'W realizacji',
      completed: 'Zakończone',
      noOrders: 'Brak zleceń produkcyjnych',
      errorLoading: 'Błąd wczytywania danych',
      unit: 'j.m.',
      min: 'min',
      hours: 'godz'
    },
    en: {
      title: 'Production Planning',
      schedule: 'Schedule',
      bom: 'Bill of Materials',
      capacity: 'Capacity Usage',
      orderId: 'Order No.',
      product: 'Product',
      quantity: 'Quantity',
      status: 'Status',
      startDate: 'Start Date',
      endDate: 'End Date',
      priority: 'Priority',
      machine: 'Machine/Work Center',
      progress: 'Progress',
      viewBom: 'View BOM',
      materials: 'Materials',
      operations: 'Operations',
      materialCode: 'Material Code',
      materialName: 'Name',
      requiredQty: 'Required Qty',
      availableQty: 'Available Qty',
      missingQty: 'Missing',
      operationNo: 'Op. No.',
      operationName: 'Operation',
      workCenter: 'Work Center',
      setupTime: 'Setup Time',
      runTime: 'Cycle Time',
      totalTime: 'Total Time',
      close: 'Close',
      high: 'High',
      medium: 'Medium',
      low: 'Low',
      new: 'New',
      planned: 'Planned',
      inProgress: 'In Progress',
      completed: 'Completed',
      noOrders: 'No production orders',
      errorLoading: 'Error loading data',
      unit: 'unit',
      min: 'min',
      hours: 'hrs'
    }
  }), [])

  const l = labels[t.currentLang] || labels.pl

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [ordersData, productsData] = await Promise.all([
        api.getOrders(),
        api.getProducts()
      ])
      setOrders(ordersData.filter(o => o.status !== 'Invoiced'))
      setProducts(productsData)
    } catch (err) {
      addToast(l.errorLoading, 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast, l.errorLoading])

  useEffect(() => {
    loadData()
  }, [loadData])

  const getPriorityLabel = (priority) => {
    const map = {
      high: l.high,
      medium: l.medium,
      low: l.low
    }
    return map[priority] || priority
  }

  const getStatusLabel = (status) => {
    const map = {
      New: l.new,
      Planned: l.planned,
      InProd: l.inProgress,
      Done: l.completed
    }
    return map[status] || status
  }

  const viewBom = async (order) => {
    setSelectedOrder(order)

    // Mock BOM data - w rzeczywistości pobierałbyś z API
    const mockBom = {
      materials: [
        {
          material_code: 'MAT-001',
          material_name: 'Stal S235',
          required_qty: 50,
          available_qty: 45,
          unit: 'kg'
        },
        {
          material_code: 'MAT-002',
          material_name: 'Farba RAL 9010',
          required_qty: 2,
          available_qty: 5,
          unit: 'l'
        }
      ],
      operations: [
        {
          operation_no: 10,
          operation_name: 'Cięcie',
          work_center: 'Piła taśmowa #1',
          setup_time: 15,
          run_time: 5
        },
        {
          operation_no: 20,
          operation_name: 'Spawanie',
          work_center: 'Spawalnia A',
          setup_time: 30,
          run_time: 120
        },
        {
          operation_no: 30,
          operation_name: 'Malowanie',
          work_center: 'Kabina malarska',
          setup_time: 20,
          run_time: 60
        }
      ]
    }

    setBomData(mockBom)
    setShowBomModal(true)
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>{l.title}</h1>
        <div className={styles.viewTabs}>
          <button
            className={view === 'schedule' ? styles.tabActive : styles.tab}
            onClick={() => setView('schedule')}
          >
            {l.schedule}
          </button>
          <button
            className={view === 'bom' ? styles.tabActive : styles.tab}
            onClick={() => setView('bom')}
          >
            {l.bom}
          </button>
          <button
            className={view === 'capacity' ? styles.tabActive : styles.tab}
            onClick={() => setView('capacity')}
          >
            {l.capacity}
          </button>
        </div>
      </div>

      {view === 'schedule' && (
        <>
          {orders.length === 0 ? (
            <div className={styles.empty}>{l.noOrders}</div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>{l.orderId}</th>
                    <th>{l.product}</th>
                    <th>{l.quantity}</th>
                    <th>{l.status}</th>
                    <th>{l.priority}</th>
                    <th>{l.startDate}</th>
                    <th>{l.endDate}</th>
                    <th>{l.progress}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.order_id}>
                      <td><strong>{order.order_id}</strong></td>
                      <td>{order.product_name || '—'}</td>
                      <td>{order.quantity || '—'}</td>
                      <td>
                        <span className={`${styles.badge} ${styles[`badge${order.status}`]}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.priority} ${styles[`priority${order.priority || 'medium'}`]}`}>
                          {getPriorityLabel(order.priority || 'medium')}
                        </span>
                      </td>
                      <td>{order.start_date || '—'}</td>
                      <td>{order.due_date || '—'}</td>
                      <td>
                        <div className={styles.progressBar}>
                          <div
                            className={styles.progressFill}
                            style={{ width: `${order.progress || 0}%` }}
                          />
                          <span className={styles.progressText}>{order.progress || 0}%</span>
                        </div>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => viewBom(order)}
                        >
                          {l.viewBom}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {view === 'bom' && (
        <div className={styles.bomList}>
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
            Wybierz zlecenie z harmonogramu, aby wyświetlić recepturę
          </p>
        </div>
      )}

      {view === 'capacity' && (
        <div className={styles.capacity}>
          <div className={styles.capacityCard}>
            <h3>Wykorzystanie stanowisk pracy</h3>
            <div className={styles.capacityBars}>
              <div className={styles.capacityItem}>
                <div className={styles.capacityLabel}>Piła taśmowa #1</div>
                <div className={styles.capacityBar}>
                  <div className={styles.capacityFill} style={{ width: '75%', background: '#ef4444' }} />
                  <span>75%</span>
                </div>
              </div>
              <div className={styles.capacityItem}>
                <div className={styles.capacityLabel}>Spawalnia A</div>
                <div className={styles.capacityBar}>
                  <div className={styles.capacityFill} style={{ width: '60%', background: '#f59e0b' }} />
                  <span>60%</span>
                </div>
              </div>
              <div className={styles.capacityItem}>
                <div className={styles.capacityLabel}>Kabina malarska</div>
                <div className={styles.capacityBar}>
                  <div className={styles.capacityFill} style={{ width: '40%', background: '#10b981' }} />
                  <span>40%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showBomModal && selectedOrder && (
        <ModalOverlay onClose={() => setShowBomModal(false)}>
          <div className={styles.bomModal}>
            <h2>
              {l.bom}: {selectedOrder.order_id}
            </h2>
            <div className={styles.bomProduct}>
              <strong>{l.product}:</strong> {selectedOrder.product_name || '—'}
              <br />
              <strong>{l.quantity}:</strong> {selectedOrder.quantity || '—'}
            </div>

            <div className={styles.bomSection}>
              <h3>{l.materials}</h3>
              <table className={styles.bomTable}>
                <thead>
                  <tr>
                    <th>{l.materialCode}</th>
                    <th>{l.materialName}</th>
                    <th>{l.requiredQty}</th>
                    <th>{l.availableQty}</th>
                    <th>{l.missingQty}</th>
                    <th>{l.unit}</th>
                  </tr>
                </thead>
                <tbody>
                  {bomData.materials?.map((mat, idx) => (
                    <tr key={idx}>
                      <td>{mat.material_code}</td>
                      <td>{mat.material_name}</td>
                      <td>{mat.required_qty}</td>
                      <td>{mat.available_qty}</td>
                      <td className={mat.available_qty < mat.required_qty ? styles.shortage : ''}>
                        {mat.available_qty < mat.required_qty ? (mat.required_qty - mat.available_qty) : '—'}
                      </td>
                      <td>{mat.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.bomSection}>
              <h3>{l.operations}</h3>
              <table className={styles.bomTable}>
                <thead>
                  <tr>
                    <th>{l.operationNo}</th>
                    <th>{l.operationName}</th>
                    <th>{l.workCenter}</th>
                    <th>{l.setupTime}</th>
                    <th>{l.runTime}</th>
                    <th>{l.totalTime}</th>
                  </tr>
                </thead>
                <tbody>
                  {bomData.operations?.map((op, idx) => (
                    <tr key={idx}>
                      <td>{op.operation_no}</td>
                      <td>{op.operation_name}</td>
                      <td>{op.work_center}</td>
                      <td>{op.setup_time} {l.min}</td>
                      <td>{op.run_time} {l.min}</td>
                      <td>{op.setup_time + op.run_time} {l.min}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.modalActions}>
              <button className="btn btn-primary" onClick={() => setShowBomModal(false)}>
                {l.close}
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  )
}

