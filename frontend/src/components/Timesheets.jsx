import React, { useState, useEffect } from 'react';
import * as api from '../services/api';
import Calendar from './Calendar';

export default function Timesheets({ lang }) {
  const [timesheets, setTimesheets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterEmpId, setFilterEmpId] = useState('');
  const fmtLocal = (d) => {
    const y = d.getFullYear();
    const m = (d.getMonth()+1).toString().padStart(2,'0');
    const day = d.getDate().toString().padStart(2,'0');
    return `${y}-${m}-${day}`;
  };
  const [selectedDate, setSelectedDate] = useState(fmtLocal(new Date()));
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [summary, setSummary] = useState({});
  const [weekly, setWeekly] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [approvedOnly, setApprovedOnly] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    emp_id: '',
    ts_date: '',
    order_id: '',
    operation_no: '',
    hours: '',
    notes: ''
  });

  const t = lang === 'pl' ? {
    title: 'Czas pracy',
    employee: 'Pracownik',
    date: 'Data',
    order: 'Zamówienie',
    operation: 'Operacja',
    hours: 'Godziny',
    notes: 'Notatki',
    actions: 'Akcje',
    add: 'Dodaj wpis',
    edit: 'Edytuj',
    delete: 'Usuń',
    save: 'Zapisz',
    cancel: 'Anuluj',
    loading: 'Ładowanie...',
    error: 'Błąd',
    noItems: 'Brak wpisów',
    selectEmployee: 'Wybierz pracownika',
    selectOrder: 'Wybierz zamówienie',
    approvedOnly: 'Tylko zatwierdzone'
  } : {
    title: 'Timesheets',
    employee: 'Employee',
    date: 'Date',
    order: 'Order',
    operation: 'Operation',
    hours: 'Hours',
    notes: 'Notes',
    actions: 'Actions',
    add: 'Add Entry',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    loading: 'Loading...',
    error: 'Error',
    noItems: 'No entries',
    selectEmployee: 'Select employee',
    selectOrder: 'Select order',
    approvedOnly: 'Approved only'
  };

  useEffect(() => {
    loadTimesheets();
    loadEmployees();
    loadOrders();
    // attempt to load profile to check admin
    (async () => {
      try {
        const p = await api.getProfile();
        if (p && (p.is_admin === true || p.is_admin === 1)) setIsAdmin(true);
      } catch (e) {
        // not logged in or not admin; leave as false
      }
    })();
  }, []);

  useEffect(() => {
    loadSummary();
    loadWeekly();
  }, [currentMonth, filterEmpId]);

  const loadTimesheets = async () => {
    try {
      setLoading(true);
      const data = await api.getTimesheets();
      setTimesheets(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const monthRange = (y, m) => {
    const start = fmtLocal(new Date(y, m, 1));
    const end = fmtLocal(new Date(y, m + 1, 0));
    return { start, end };
  };

  const loadSummary = async () => {
    try {
      const { year, month } = currentMonth;
      const { start, end } = monthRange(year, month);
      const data = await api.getTimesheetSummary({ fromDate: start, toDate: end, empId: filterEmpId || undefined, approved: approvedOnly ? true : undefined });
      const map = {};
      (data || []).forEach(r => { if (r.date) map[r.date] = Number(r.total_hours) });
      setSummary(map);
    } catch (err) {
      console.error('Failed to load summary', err);
    }
  };

  const loadWeekly = async () => {
    try {
      const { year, month } = currentMonth;
      const { start, end } = monthRange(year, month);
      const data = await api.getTimesheetWeeklySummary({ fromDate: start, toDate: end, empId: filterEmpId || undefined, approved: approvedOnly ? true : undefined });
      setWeekly(data || []);
    } catch (err) {
      console.error('Failed to load weekly summary', err);
    }
  };

  const loadEmployees = async () => {
    try {
      const data = await api.getEmployees();
      setEmployees(data || []);
    } catch (err) {
      console.error('Failed to load employees:', err);
    }
  };

  const loadOrders = async () => {
    try {
      const data = await api.getOrders();
      setOrders(data || []);
    } catch (err) {
      console.error('Failed to load orders:', err);
    }
  };

  const handleAddClick = () => {
    setEditingItem(null);
    setFormData({
      emp_id: '',
      ts_date: selectedDate || new Date().toISOString().split('T')[0],
      order_id: '',
      operation_no: '',
      hours: '',
      notes: ''
    });
    setShowForm(true);
  };

  const handleEditClick = (item) => {
    setEditingItem(item);
    setFormData({
      emp_id: item.emp_id,
      ts_date: item.ts_date,
      order_id: item.order_id || '',
      operation_no: item.operation_no || '',
      hours: item.hours,
      notes: item.notes || ''
    });
    setShowForm(true);
  };

  const handleDeleteClick = async (tsId) => {
    if (!window.confirm('Delete this entry?')) return;
    try {
      await api.deleteTimesheet(tsId);
      loadTimesheets();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.updateTimesheet(editingItem.ts_id, formData);
      } else {
        await api.createTimesheet(formData);
      }
      loadTimesheets();
      setShowForm(false);
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (loading) return <div className="loading">{t.loading}</div>;

  return (
    <div className="timesheets-container">
      <div className="timesheets-header">
        <h2>{t.title}</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={filterEmpId} onChange={e => setFilterEmpId(e.target.value)}>
            <option value="">{t.selectEmployee}</option>
            {employees.map(e => (
              <option key={e.emp_id} value={e.emp_id}>{e.name} ({e.emp_id})</option>
            ))}
          </select>
          <label style={{ display:'inline-flex', alignItems:'center', gap:4 }}>
            <input type="checkbox" checked={approvedOnly} onChange={e=> setApprovedOnly(e.target.checked)} />
            {t.approvedOnly}
          </label>
          <button className="btn" onClick={() => {
            const d = new Date(currentMonth.year, currentMonth.month - 1, 1);
            setCurrentMonth({ year: d.getFullYear(), month: d.getMonth() });
          }}>{'<'}</button>
          <button className="btn" onClick={() => {
            const d = new Date(currentMonth.year, currentMonth.month + 1, 1);
            setCurrentMonth({ year: d.getFullYear(), month: d.getMonth() });
          }}>{'>'}</button>
          <button className="btn" onClick={async () => {
            try {
              const { start, end } = monthRange(currentMonth.year, currentMonth.month)
              const blob = await api.exportTimesheetsCSV({ fromDate: start, toDate: end, empId: filterEmpId || undefined })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `timesheets_${start}_${end}${filterEmpId?`_${filterEmpId}`:''}.csv`
              document.body.appendChild(a)
              a.click()
              a.remove()
              URL.revokeObjectURL(url)
            } catch (err) {
              alert('Export failed: ' + err.message)
            }
          }}>Export CSV</button>
          <button className="btn" onClick={async () => {
            try {
              const { start, end } = monthRange(currentMonth.year, currentMonth.month)
              const blob = await api.exportTimesheetsSummaryCSV({ fromDate: start, toDate: end, empId: filterEmpId || undefined })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `timesheets_summary_${start}_${end}${filterEmpId?`_${filterEmpId}`:''}.csv`
              document.body.appendChild(a)
              a.click()
              a.remove()
              URL.revokeObjectURL(url)
            } catch (err) {
              alert('Export summary failed: ' + err.message)
            }
          }}>Export Monthly Summary</button>
          <button className="btn btn-primary" onClick={handleAddClick}>{t.add}</button>
        </div>
      </div>

      {/* Monthly total banner */}
      <div className="card" style={{ margin: '8px 0', padding: 8 }}>
        <strong>Month total:</strong>{' '}
        {Object.values(summary).reduce((a,b)=> a + Number(b||0), 0)}h
      </div>

      <div className="calendar-wrapper">
        <Calendar
          year={currentMonth.year}
          month={currentMonth.month}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          totalsByDate={summary}
        />
      </div>

      {error && <div className="error-message">{t.error}: {error}</div>}

      {weekly.length > 0 && (
        <div className="card" style={{ margin: '8px 0', padding: 8 }}>
          <strong>Weekly totals</strong>
          <ul>
            {weekly.map(w => (
              <li key={w.week_label}>
                {w.week_label}: {w.total_hours}h
                <button className="btn" style={{ marginLeft: 8 }} onClick={async () => {
                  try{
                    const start = w.week_start
                    const d = new Date(start)
                    const end = fmtLocal(new Date(d.getFullYear(), d.getMonth(), d.getDate() + 6))
                    const blob = await api.exportTimesheetsCSV({ fromDate: start, toDate: end, empId: filterEmpId || undefined })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `timesheets_${w.week_label}${filterEmpId ? '_' + filterEmpId : ''}.csv`
                    document.body.appendChild(a)
                    a.click()
                    a.remove()
                    URL.revokeObjectURL(url)
                  }catch(err){
                    alert('Export week failed: ' + err.message)
                  }
                }}>Export CSV</button>
                {isAdmin && (
                  <button className="btn" style={{ marginLeft: 8 }} onClick={async () => {
                    try{
                      const start = w.week_start
                      const d = new Date(start)
                      const end = fmtLocal(new Date(d.getFullYear(), d.getMonth(), d.getDate() + 6))
                      const items = await api.getTimesheetsFiltered({ fromDate: start, toDate: end, empId: filterEmpId || undefined, approved: true })
                      for (const it of (items || [])){
                        // eslint-disable-next-line no-await-in-loop
                        await api.unapproveTimesheet(it.ts_id)
                      }
                      await loadTimesheets();
                      await loadSummary();
                      await loadWeekly();
                      alert('Unapproved week')
                    }catch(err){
                      alert('Unapprove week failed: ' + err.message)
                    }
                  }}>Unapprove Week</button>
                )}
                {isAdmin && (
                  <button className="btn" style={{ marginLeft: 8 }} onClick={async () => {
                    try{
                      const start = w.week_start
                      const d = new Date(start)
                      const end = fmtLocal(new Date(d.getFullYear(), d.getMonth(), d.getDate() + 6))
                      const items = await api.getTimesheetsFiltered({ fromDate: start, toDate: end, empId: filterEmpId || undefined, approved: false })
                      for (const it of (items || [])){
                        // eslint-disable-next-line no-await-in-loop
                        await api.approveTimesheet(it.ts_id)
                      }
                      await loadTimesheets();
                      await loadSummary();
                      await loadWeekly();
                      alert('Approved week')
                    }catch(err){
                      alert('Approve week failed: ' + err.message)
                    }
                  }}>Approve Week</button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingItem ? t.edit : t.add}</h3>
              <button className="close-btn" onClick={() => setShowForm(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="form">
              <div className="form-group">
                <label>{t.employee}</label>
                <select
                  name="emp_id"
                  value={formData.emp_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">{t.selectEmployee}</option>
                  {employees.map(e => (
                    <option key={e.emp_id} value={e.emp_id}>{e.name} ({e.emp_id})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>{t.date}</label>
                <input
                  type="date"
                  name="ts_date"
                  value={formData.ts_date}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>{t.order}</label>
                <select
                  name="order_id"
                  value={formData.order_id}
                  onChange={handleInputChange}
                >
                  <option value="">{t.selectOrder}</option>
                  {orders.map(o => (
                    <option key={o.order_id} value={o.order_id}>{o.order_id}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>{t.operation}</label>
                <input
                  type="number"
                  name="operation_no"
                  value={formData.operation_no}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>{t.hours}</label>
                <input
                  type="number"
                  name="hours"
                  value={formData.hours}
                  onChange={handleInputChange}
                  step="0.5"
                  required
                />
              </div>
              <div className="form-group">
                <label>{t.notes}</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="3"
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">{t.save}</button>
                <button type="button" className="btn" onClick={() => setShowForm(false)}>{t.cancel}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="table-container">
        {timesheets.length === 0 ? (
          <p className="empty-message">{t.noItems}</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>{t.employee}</th>
                <th>{t.date}</th>
                <th>{t.order}</th>
                <th>{t.operation}</th>
                <th>{t.hours}</th>
                <th>{t.notes}</th>
                <th>{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {timesheets
                .filter(item => !filterEmpId || item.emp_id === filterEmpId)
                .filter(item => !approvedOnly || Number(item.approved))
                .filter(item => !selectedDate || item.ts_date === selectedDate)
                .map(item => (
                <tr key={item.ts_id}>
                  <td>{item.emp_id}</td>
                  <td>{item.ts_date}</td>
                  <td>{item.order_id || '—'}</td>
                  <td>{item.operation_no || '—'}</td>
                  <td>{item.hours}</td>
                  <td>
                    {item.notes || '—'}
                    {Number(item.approved) ? (
                      <span style={{ marginLeft: 8, color: '#16a34a', fontWeight: 600 }}>Approved</span>
                    ) : null}
                  </td>
                  <td>
                    <button className="btn-sm btn-edit" onClick={() => handleEditClick(item)}>{t.edit}</button>
                    <button className="btn-sm btn-delete" onClick={() => handleDeleteClick(item.ts_id)}>{t.delete}</button>
                    {isAdmin && !Number(item.approved) ? (
                      <button className="btn-sm" onClick={async ()=>{
                        try {
                          await api.approveTimesheet(item.ts_id)
                          loadTimesheets();
                          loadSummary();
                          loadWeekly();
                        } catch(err){
                          alert('Approve failed: ' + err.message)
                        }
                      }}>Approve</button>
                    ) : isAdmin ? (
                      <button className="btn-sm" onClick={async ()=>{
                        try {
                          await api.unapproveTimesheet(item.ts_id)
                          loadTimesheets();
                          loadSummary();
                          loadWeekly();
                        } catch(err){
                          alert('Unapprove failed: ' + err.message)
                        }
                      }}>Unapprove</button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
