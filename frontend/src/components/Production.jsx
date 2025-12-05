import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import * as api from '../services/api'
import { useI18n } from '../i18n'
import { useToast } from '../lib/toastContext'
import ModalOverlay from './ModalOverlay'
import LoadingSpinner from './LoadingSpinner'
import styles from './Production.module.css'
import { detectConflicts } from '../utils/timeline'
import { translateError } from '../services/api'
import classNames from 'classnames'

export default function Production() {
  const { t } = useI18n()
  const { addToast } = useToast()
  const [orders, setOrders] = useState([])
  const [_products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('schedule') // schedule, bom, capacity
  const [timelineRange, setTimelineRange] = useState({ from: '', to: '' })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showBomModal, setShowBomModal] = useState(false)
  const [bomData, setBomData] = useState([])
  const [statusDialog, setStatusDialog] = useState({ open: false, order: null, newStatus: '', progress: 0 })
  const [savingStatus, setSavingStatus] = useState(false)
  const [timelineTooltip, setTimelineTooltip] = useState(null)
  const [draggingOrderId, setDraggingOrderId] = useState(null)
  const [timelineBanner, setTimelineBanner] = useState(null)
  const dragState = useRef(null)

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
      hours: 'godz',
      filter: 'Filtruj',
      searchPlaceholder: 'Szukaj po numerze, produkcie lub kliencie…',
      statusFilter: 'Status',
      priorityFilter: 'Priorytet',
      all: 'Wszystkie',
      ordersInProd: 'W realizacji',
      lateOrders: 'Spóźnione',
      avgProgress: 'Średni postęp',
      dueSoon: 'Najbliższe zakończenie',
      statusAdvanced: 'Status zaktualizowany',
      changeStatus: 'Aktualizuj status',
      cancel: 'Anuluj',
      save: 'Zapisz'
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
      hours: 'hrs',
      filter: 'Filter',
      searchPlaceholder: 'Search by order, product or customer…',
      statusFilter: 'Status',
      priorityFilter: 'Priority',
      all: 'All',
      ordersInProd: 'In production',
      lateOrders: 'Late orders',
      avgProgress: 'Avg. progress',
      dueSoon: 'Next due',
      statusAdvanced: 'Status updated',
      changeStatus: 'Update status',
      cancel: 'Cancel',
      save: 'Save'
    }
  }), [])

  const l = labels[t.currentLang] || labels.pl

  const statusOptions = useMemo(() => ([
    { value: 'all', label: l.all },
    { value: 'New', label: l.new },
    { value: 'Planned', label: l.planned },
    { value: 'InProd', label: l.inProgress },
    { value: 'Done', label: l.completed }
  ]), [l])

  const priorityOptions = useMemo(() => ([
    { value: 'all', label: l.all },
    { value: 'high', label: l.high },
    { value: 'medium', label: l.medium },
    { value: 'low', label: l.low }
  ]), [l])

  const boardColumns = useMemo(() => ([
    { key: 'New', label: l.new },
    { key: 'Planned', label: l.planned },
    { key: 'InProd', label: l.inProgress },
    { key: 'Done', label: l.completed }
  ]), [l])

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
      addToast(translateError(err, t.currentLang) || l.errorLoading, 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast, l.errorLoading, t.currentLang])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (orders.length && (!timelineRange.from || !timelineRange.to)) {
      const starts = orders.map(order => order.start_date).filter(Boolean)
      const ends = orders.map(order => order.due_date || order.start_date).filter(Boolean)
      if (starts.length && ends.length) {
        const min = new Date(Math.min(...starts.map(d => new Date(d))))
        const max = new Date(Math.max(...ends.map(d => new Date(d))))
        const padDays = 3 * 24 * 60 * 60 * 1000
        const fromIso = new Date(min.getTime() - padDays).toISOString().slice(0, 10)
        const toIso = new Date(max.getTime() + padDays).toISOString().slice(0, 10)
        setTimelineRange({ from: fromIso, to: toIso })
      }
    }
  }, [orders, timelineRange.from, timelineRange.to])

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

  const filteredOrders = useMemo(() => {
    const probe = search.trim().toLowerCase()
    return orders.filter(order => {
      const matchesSearch = !probe || [
        order.order_id,
        order.product_name,
        order.customer_id
      ].some(token => String(token || '').toLowerCase().includes(probe))
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter
      const matchesPriority = priorityFilter === 'all' || (order.priority || 'medium') === priorityFilter
      return matchesSearch && matchesStatus && matchesPriority
    })
  }, [orders, search, statusFilter, priorityFilter])

  const kpis = useMemo(() => {
    if (!orders.length) {
      return {
        inProduction: 0,
        late: 0,
        avgProgress: 0,
        nextDue: '—'
      }
    }
    const inProduction = orders.filter(o => o.status === 'InProd').length
    const late = orders.filter(o => {
      if (!o.due_date) return false
      return new Date(o.due_date) < new Date() && o.status !== 'Done'
    }).length
    const avgProgress = Math.round(
      orders.reduce((acc, o) => acc + Number(o.progress || 0), 0) / orders.length
    )
    const upcoming = orders
      .filter(o => o.due_date)
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))[0]
    return {
      inProduction,
      late,
      avgProgress,
      nextDue: upcoming?.due_date || '—'
    }
  }, [orders])

  const timelineOrders = useMemo(() => {
    if (!timelineRange.from || !timelineRange.to) return []
    const fromDate = new Date(timelineRange.from)
    const toDate = new Date(timelineRange.to)
    return orders.filter(order => {
      const start = new Date(order.start_date)
      const end = new Date(order.due_date || order.start_date)
      if (isNaN(start) || isNaN(end)) return false
      return start >= fromDate && end <= toDate
    })
  }, [orders, timelineRange])

  const timelineSpan = useMemo(() => {
    if (!timelineRange.from || !timelineRange.to) return 1
    const span = new Date(timelineRange.to) - new Date(timelineRange.from)
    return Math.max(span, 1)
  }, [timelineRange])

  const timelineLanes = useMemo(() => {
    if (!timelineOrders.length) return []
    const groups = timelineOrders.reduce((acc, order) => {
      const lane = order.work_center || order.machine || l.capacity
      acc[lane] = acc[lane] || []
      acc[lane].push(order)
      return acc
    }, {})
    return Object.entries(groups).map(([name, items]) => ({ name, items }))
  }, [timelineOrders, l.capacity])

  const timelineConflicts = useMemo(() => detectConflicts(timelineOrders), [timelineOrders])

  const conflictSet = useMemo(() => new Set(timelineConflicts.flatMap(pair => pair)), [timelineConflicts])

  const getBarStyle = (order) => {
    const start = new Date(order.start_date)
    const end = new Date(order.due_date || order.start_date)
    const from = new Date(timelineRange.from)
    const left = Math.max(0, start - from)
    const width = Math.max(1, end - start || 1)
    return {
      left: `${(left / timelineSpan) * 100}%`,
      width: `${(width / timelineSpan) * 100}%`
    }
  }

  const clampDate = (date) => {
    if (!(date instanceof Date)) {
      date = new Date(date)
    }
    const todayFloor = new Date()
    todayFloor.setHours(0, 0, 0, 0)
    const minCandidate = timelineRange.from ? new Date(timelineRange.from) : todayFloor
    const maxCandidate = timelineRange.to ? new Date(timelineRange.to) : todayFloor
    const min = minCandidate < todayFloor ? todayFloor : minCandidate
    const max = maxCandidate < min ? min : maxCandidate
    if (date < min) return min
    if (date > max) return max
    return date
  }

  const MIN_DURATION_MS = 60 * 60 * 1000

  const handlePointerDown = (event, order, mode = 'move') => {
    event.preventDefault()
    event.stopPropagation()
    const track = event.currentTarget.closest('[data-track="timeline"]')
    if (!track) return
    dragState.current = {
      order,
      startX: event.clientX,
      track,
      originalStart: new Date(order.start_date),
      originalEnd: new Date(order.due_date || order.start_date),
      mode
    }
    setDraggingOrderId(order.order_id)
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
  }

  const handlePointerMove = (event) => {
    if (!dragState.current || !timelineRange.from || !timelineRange.to) return
    const { order, startX, track, originalStart, originalEnd, mode } = dragState.current
    const deltaPx = event.clientX - startX
    const trackWidth = track.getBoundingClientRect().width
    if (!trackWidth) return
    const timelineMs = new Date(timelineRange.to) - new Date(timelineRange.from)
    const deltaMs = (deltaPx / trackWidth) * timelineMs

    setOrders(prev => prev.map(o => {
      if (o.order_id !== order.order_id) return o
      if (mode === 'resize-start') {
        const candidate = new Date(originalStart.getTime() + deltaMs)
        const clamped = clampDate(candidate)
        const capped = clamped.getTime() > originalEnd.getTime() - MIN_DURATION_MS
          ? new Date(originalEnd.getTime() - MIN_DURATION_MS)
          : clamped
        return {
          ...o,
          start_date: capped.toISOString(),
          due_date: originalEnd.toISOString()
        }
      }
      if (mode === 'resize-end') {
        const candidate = new Date(originalEnd.getTime() + deltaMs)
        const clamped = clampDate(candidate)
        const padded = clamped.getTime() < originalStart.getTime() + MIN_DURATION_MS
          ? new Date(originalStart.getTime() + MIN_DURATION_MS)
          : clamped
        return {
          ...o,
          start_date: originalStart.toISOString(),
          due_date: padded.toISOString()
        }
      }
      const duration = originalEnd - originalStart || MIN_DURATION_MS
      const candidateStart = new Date(originalStart.getTime() + deltaMs)
      const newStart = clampDate(candidateStart)
      const newEnd = new Date(Math.max(newStart.getTime() + duration, newStart.getTime() + MIN_DURATION_MS))
      return {
        ...o,
        start_date: newStart.toISOString(),
        due_date: clampDate(newEnd).toISOString()
      }
    }))
  }

  const handlePointerUp = async () => {
    if (!dragState.current) return
    const { order } = dragState.current
    dragState.current = null
    window.removeEventListener('pointermove', handlePointerMove)
    window.removeEventListener('pointerup', handlePointerUp)
    setDraggingOrderId(null)
    const updated = orders.find(o => o.order_id === order.order_id)
    if (!updated) return
    try {
      await api.updateOrderSchedule(order.order_id, {
        start_date: updated.start_date,
        due_date: updated.due_date
      })
      const successMessage = t.currentLang === 'pl'
        ? `Zlecenie #${order.order_id} przesunięte pomyślnie`
        : `Order #${order.order_id} rescheduled successfully`
      addToast(successMessage, 'success')
      setTimelineBanner({ type: 'success', message: successMessage })
      // Auto-hide success banner after 3 seconds
      setTimeout(() => setTimelineBanner(null), 3000)
      await loadTimelineOrders()
    } catch (err) {
      const message = translateError(err, t.currentLang) || err?.message || (t.currentLang === 'pl' ? 'Nie udało się zapisać zmian' : 'Failed to save changes')
      addToast(message, 'error')
      setTimelineBanner({ type: 'error', message })
      await loadTimelineOrders()
    }
  }

  const loadTimelineOrders = useCallback(async () => {
    if (!timelineRange.from || !timelineRange.to) return
    try {
      setLoading(true)
      const data = await api.getOrders({ fromDate: timelineRange.from, toDate: timelineRange.to })
      setOrders(data.filter(o => o.status !== 'Invoiced'))
    } catch {
      addToast(l.errorLoading, 'error')
    } finally {
      setLoading(false)
    }
  }, [timelineRange, addToast, l.errorLoading])

  const handleTimelineHover = (order, event) => {
    if (!order) {
      setTimelineTooltip(null)
      return
    }
    const rect = event.currentTarget.getBoundingClientRect()
    setTimelineTooltip({
      order,
      x: rect.left + rect.width / 2,
      y: rect.top - 8
    })
  }

  const openStatusDialog = (order) => {
    setStatusDialog({
      open: true,
      order,
      newStatus: order.status || 'New',
      progress: Number(order.progress || 0)
    })
  }

  const closeStatusDialog = () => {
    setStatusDialog({ open: false, order: null, newStatus: '', progress: 0 })
  }

  const formatDate = (value) => {
    if (!value) return '—'
    try {
      return new Date(value).toLocaleDateString(t.currentLang === 'pl' ? 'pl-PL' : 'en-US')
    } catch {
      return value
    }
  }

  const handleStatusSave = async () => {
    if (!statusDialog.order) return
    setSavingStatus(true)
    try {
      await api.updateOrder(statusDialog.order.order_id, {
        status: statusDialog.newStatus,
        progress: statusDialog.progress
      })
      await loadData()
      addToast(l.statusAdvanced, 'success')
      closeStatusDialog()
    } catch (err) {
      addToast(err?.message || 'Update failed', 'error')
    } finally {
      setSavingStatus(false)
    }
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
          <button
            className={view === 'timeline' ? styles.tabActive : styles.tab}
            onClick={() => setView('timeline')}
          >
            Timeline
          </button>
        </div>
      </div>

      {view === 'schedule' && (
        orders.length === 0 ? (
          <div className={styles.empty}>{l.noOrders}</div>
        ) : (
          <>
            <div className={styles.controls}>
              <input
                className={styles.searchInput}
                type="search"
                placeholder={l.searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <label className="visually-hidden" htmlFor="status-filter">{l.statusFilter}</label>
              <select
                id="status-filter"
                className={styles.select}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {statusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <label className="visually-hidden" htmlFor="priority-filter">{l.priorityFilter}</label>
              <select
                id="priority-filter"
                className={styles.select}
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                {priorityOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className={styles.kpis}>
              <div className={styles.kpiCard}>
                <span className={styles.kpiLabel}>{l.ordersInProd}</span>
                <span className={styles.kpiValue}>{kpis.inProduction}</span>
              </div>
              <div className={styles.kpiCard}>
                <span className={styles.kpiLabel}>{l.lateOrders}</span>
                <span className={styles.kpiValue}>{kpis.late}</span>
              </div>
              <div className={styles.kpiCard}>
                <span className={styles.kpiLabel}>{l.avgProgress}</span>
                <span className={styles.kpiValue}>{kpis.avgProgress}%</span>
              </div>
              <div className={styles.kpiCard}>
                <span className={styles.kpiLabel}>{l.dueSoon}</span>
                <span className={styles.kpiValue}>{formatDate(kpis.nextDue)}</span>
              </div>
            </div>

            <div className={styles.board}>
              {boardColumns.map(column => (
                <section key={column.key} className={styles.column}>
                  <header className={styles.columnHeader}>
                    <span>{column.label}</span>
                    <span>{filteredOrders.filter(o => o.status === column.key).length}</span>
                  </header>
                  {filteredOrders.filter(o => o.status === column.key).map(order => (
                    <article key={order.order_id} className={styles.orderCard}>
                      <div className={styles.orderHeader}>
                        <span className={styles.orderId}>#{order.order_id}</span>
                        <span className={`${styles.badge} ${styles[`badge${order.status}`]}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                      <div>{order.product_name || '—'}</div>
                      <div className={styles.progressMeta}>
                        <span>{l.priority}: {getPriorityLabel(order.priority || 'medium')}</span>
                        <span>{formatDate(order.due_date)}</span>
                      </div>
                      <div className={styles.progressBar}>
                        <div className={styles.progressFill} style={{ width: `${order.progress || 0}%` }} />
                      </div>
                      <div className={styles.actions}>
                        <button type="button" onClick={() => viewBom(order)}>
                          {l.viewBom}
                        </button>
                        <button type="button" onClick={() => openStatusDialog(order)}>
                          {l.status}
                        </button>
                      </div>
                    </article>
                  ))}
                </section>
              ))}
            </div>
          </>
        )
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

      {view === 'timeline' && (
        <div className={styles.timeline}>
          <div className={styles.timelineControls}>
            <label>
              Start
              <input type="date" value={timelineRange.from} onChange={(e) => setTimelineRange({ ...timelineRange, from: e.target.value })} />
            </label>
            <label>
              Koniec
              <input type="date" value={timelineRange.to} onChange={(e) => setTimelineRange({ ...timelineRange, to: e.target.value })} />
            </label>
            <button onClick={loadTimelineOrders}>Filtruj</button>
          </div>
          {timelineBanner && (
            <div className={classNames(
              styles.timelineBanner,
              timelineBanner.type === 'error' && styles.timelineBannerError,
              timelineBanner.type === 'success' && styles.timelineBannerSuccess,
              timelineBanner.type === 'info' && styles.timelineBannerInfo
            )}>
              {timelineBanner.message}
            </div>
          )}
          {!timelineOrders.length && (
            <p className={styles.notice}>{l.noOrders}</p>
          )}
          {timelineOrders.length > 0 && (
            <div className={styles.timelineChart}>
              {timelineLanes.map((lane) => (
                <div className={styles.timelineLane} key={lane.name}>
                  <div className={styles.timelineLaneLabel}>{lane.name}</div>
                  <div className={styles.timelineTrack} data-track="timeline">
                    {lane.items.map((order) => (
                      <button
                        key={order.order_id}
                        className={`${styles.timelineBlock} ${draggingOrderId === order.order_id ? styles.timelineBlockDragging : ''} ${conflictSet.has(order.order_id) ? styles.timelineBlockConflict : ''}`}
                        style={getBarStyle(order)}
                        onMouseEnter={(e) => handleTimelineHover(order, e)}
                        onMouseLeave={() => handleTimelineHover(null)}
                        onPointerDown={(e) => handlePointerDown(e, order)}
                      >
                        <span className={styles.timelineHandle} data-handle="start" onPointerDown={(e) => handlePointerDown(e, order, 'resize-start')} />
                        <span>{order.order_id}</span>
                        <span className={styles.timelineHandle} data-handle="end" onPointerDown={(e) => handlePointerDown(e, order, 'resize-end')} />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {timelineConflicts.length > 0 && (
            <div className={styles.timelineConflicts}>
              {timelineConflicts.map(([a, b]) => (
                <span key={`${a}-${b}`}>
                  {a} ↔ {b}
                </span>
              ))}
            </div>
          )}
          {timelineTooltip && (
            <div className={styles.timelineTooltip} style={{ left: timelineTooltip.x, top: timelineTooltip.y }}>
              <p><strong>#{timelineTooltip.order.order_id}</strong></p>
              <p>{timelineTooltip.order.product_name || '—'}</p>
              <p>{formatDate(timelineTooltip.order.start_date)} → {formatDate(timelineTooltip.order.due_date)}</p>
              <p>{timelineTooltip.order.work_center || timelineTooltip.order.machine}</p>
            </div>
          )}
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

      {statusDialog.open && (
        <ModalOverlay onClose={closeStatusDialog}>
          <div className={styles.statusDialog}>
            <h2>{l.changeStatus}</h2>
            <div className={styles.statusFields}>
              <label>
                {l.status}
                <select
                  value={statusDialog.newStatus}
                  onChange={e => setStatusDialog({ ...statusDialog, newStatus: e.target.value })}
                >
                  {statusOptions.filter(opt => opt.value !== 'all').map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </label>
              <label>
                {l.progress}
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={statusDialog.progress}
                  onChange={e => setStatusDialog({ ...statusDialog, progress: Number(e.target.value) })}
                />
              </label>
            </div>
            <div className={styles.modalActions}>
              <button type="button" className="btn btn-secondary" onClick={closeStatusDialog}>
                {l.cancel}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleStatusSave}
                disabled={savingStatus}
              >
                {savingStatus ? <LoadingSpinner size="small" /> : l.save}
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  )
}
