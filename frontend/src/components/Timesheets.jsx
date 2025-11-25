import React, { useEffect, useState } from 'react';
import * as api from '../services/api';
import Calendar from './Calendar';
import { useI18n } from '../i18n';
import { useToast } from './Toast';

export default function Timesheets({ lang }) {
  const toast = useToast();
  const { t: tt } = useI18n();
  const T = (key, fallback) => {
    const v = tt(key);
    return v !== key ? v : fallback;
  };

  const [timesheets, setTimesheets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterEmpId, setFilterEmpId] = useState('');
  const fmtLocal = (d) => {
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
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

  useEffect(() => {
    loadTimesheets();
    loadEmployees();
    loadOrders();
    (async () => {
      try {
        const p = await api.getProfile();
        if (p && (p.is_admin === true || p.is_admin === 1)) setIsAdmin(true);
      } catch (_) {
        // not logged in or not admin; leave as false
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadSummary();
    loadWeekly();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth, filterEmpId, approvedOnly]);

  const monthRange = (y, m) => {
    const start = fmtLocal(new Date(y, m, 1));
    const end = fmtLocal(new Date(y, m + 1, 0));
    return { start, end };
  };

  const loadTimesheets = async () => {
    try {
      setLoading(true);
      const data = await api.getTimesheets();
      setTimesheets(data || []);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const { year, month } = currentMonth;
      const { start, end } = monthRange(year, month);
      const data = await api.getTimesheetSummary({
        fromDate: start,
        toDate: end,
        empId: filterEmpId || undefined,
        approved: approvedOnly ? true : undefined
      });
      const map = {};
      (data || []).forEach((r) => {
        if (r.date) map[r.date] = Number(r.total_hours);
      });
      setSummary(map);
    } catch (err) {
      console.error('Failed to load summary', err);
    }
  };

  const loadWeekly = async () => {
    try {
      const { year, month } = currentMonth;
      const { start, end } = monthRange(year, month);
      const data = await api.getTimesheetWeeklySummary({
        fromDate: start,
        toDate: end,
        empId: filterEmpId || undefined,
        approved: approvedOnly ? true : undefined
      });
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
    if (!window.confirm(T('confirm_delete', 'Delete this entry?'))) return;
    try {
      await api.deleteTimesheet(tsId);
      await loadTimesheets();
      toast.show(T('ts_delete_success','Entry deleted'))
    } catch (err) {
      toast.show(`${T('ts_delete_failed','Failed to delete entry')}: ${err.message || String(err)}`, 'error')
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.updateTimesheet(editingItem.ts_id, formData);
        toast.show(T('ts_update_success','Entry updated'))
      } else {
        await api.createTimesheet(formData);
        toast.show(T('ts_save_success','Timesheet saved successfully.'))
      }
      await loadTimesheets();
      setShowForm(false);
    } catch (err) {
      toast.show(`${T('ts_save_failed','Failed to save entry')}: ${err.message || String(err)}`, 'error')
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (loading) return <div className="loading">{T('ts_loading', 'Loading...')}</div>;

  return (
    <div className="timesheets-container">
      <div className="timesheets-header">
        <h2>{T('ts_title', 'Timesheets')}</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={filterEmpId} onChange={(e) => setFilterEmpId(e.target.value)}>
            <option value="">{T('ts_select_employee', 'Select employee')}</option>
            {employees.map((e) => (
              <option key={e.emp_id} value={e.emp_id}>
                {e.name} ({e.emp_id})
              </option>
            ))}
          </select>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <input
              type="checkbox"
              checked={approvedOnly}
              onChange={(e) => setApprovedOnly(e.target.checked)}
            />
            {T('ts_approved_only', 'Approved only')}
          </label>
          <button
            className="btn"
            onClick={() => {
              const d = new Date(currentMonth.year, currentMonth.month - 1, 1);
              setCurrentMonth({ year: d.getFullYear(), month: d.getMonth() });
            }}
          >
            {'<'}
          </button>
          <button
            className="btn"
            onClick={() => {
              const d = new Date(currentMonth.year, currentMonth.month + 1, 1);
              setCurrentMonth({ year: d.getFullYear(), month: d.getMonth() });
            }}
          >
            {'>'}
          </button>
          <button
            className="btn btn-sm"
            onClick={async () => {
              try {
                const { start, end } = monthRange(currentMonth.year, currentMonth.month);
                const blob = await api.exportTimesheetsCSV({
                  fromDate: start,
                  toDate: end,
                  empId: filterEmpId || undefined
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `timesheets_${start}_${end}${filterEmpId ? `_${filterEmpId}` : ''}.csv`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
                toast.show(T('ts_export_success', 'Export ready'));
              } catch (err) {
                toast.show(`${T('ts_export_failed', 'Export failed')}: ${err.message || String(err)}`, 'error');
              }
            }}
          >
            {T('ts_export_csv', 'Export CSV')}
          </button>
          <button
            className="btn btn-sm"
            onClick={async () => {
              try {
                const { start, end } = monthRange(currentMonth.year, currentMonth.month);
                const blob = await api.exportTimesheetsSummaryCSV({
                  fromDate: start,
                  toDate: end,
                  empId: filterEmpId || undefined
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `timesheets_summary_${start}_${end}${filterEmpId ? `_${filterEmpId}` : ''}.csv`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
                toast.show(T('ts_export_summary_success', 'Summary export ready'));
              } catch (err) {
                toast.show(`${T('ts_export_summary_failed', 'Summary export failed')}: ${err.message || String(err)}`, 'error');
              }
            }}
          >
            {T('ts_export_monthly', 'Export Monthly Summary')}
          </button>
          <button className="btn btn-primary" onClick={handleAddClick}>
            {T('ts_add', 'Add Entry')}
          </button>
        </div>
      </div>

      {/* Monthly total banner */}
      <div className="card" style={{ margin: '8px 0', padding: 8 }}>
        <strong>{T('ts_month_total', 'Month total')}:</strong>{' '}
        {Object.values(summary).reduce((a, b) => a + Number(b || 0), 0)}h
      </div>

      <div className="calendar-wrapper">
        <Calendar
          year={currentMonth.year}
          month={currentMonth.month}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          totalsByDate={summary}
          lang={lang}
        />
      </div>

      {error && <div className="error-message">{T('ts_error', 'Error')}: {error}</div>}

      {weekly.length > 0 && (
        <div className="card" style={{ margin: '8px 0', padding: 8 }}>
          <strong>{T('ts_weekly_totals', 'Weekly totals')}</strong>
          <ul>
            {weekly.map((w) => (
              <li key={w.week_label}>
                {w.week_label}: {w.total_hours}h
                <button
                  className="btn"
                  style={{ marginLeft: 8 }}
                  onClick={async () => {
                    try {
                      const start = w.week_start;
                      const d = new Date(start);
                      const end = fmtLocal(new Date(d.getFullYear(), d.getMonth(), d.getDate() + 6));
                      const blob = await api.exportTimesheetsCSV({
                        fromDate: start,
                        toDate: end,
                        empId: filterEmpId || undefined
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `timesheets_${w.week_label}${filterEmpId ? '_' + filterEmpId : ''}.csv`;
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      URL.revokeObjectURL(url);
                      toast.show(T('ts_export_success', 'Export ready'));
                    } catch (err) {
                      toast.show(`${T('ts_export_failed', 'Export failed')}: ${err.message || String(err)}`, 'error');
                    }
                  }}
                >
                  {T('ts_export_csv', 'Export CSV')}
                </button>
                {isAdmin && (
                  <button
                    className="btn"
                    style={{ marginLeft: 8 }}
                    onClick={async () => {
                      try {
                        const start = w.week_start;
                        const d = new Date(start);
                        const end = fmtLocal(new Date(d.getFullYear(), d.getMonth(), d.getDate() + 6));
                        const items = await api.getTimesheetsFiltered({
                          fromDate: start,
                          toDate: end,
                          empId: filterEmpId || undefined,
                          approved: true
                        });
                        for (const it of items || []) {
                          // eslint-disable-next-line no-await-in-loop
                          await api.unapproveTimesheet(it.ts_id);
                        }
                        await loadTimesheets();
                        await loadSummary();
                        await loadWeekly();
                        toast.show(T('ts_unapprove_success', 'Week unapproved'));
                      } catch (err) {
                        toast.show(`${T('ts_unapprove_failed', 'Unapprove failed')}: ${err.message || String(err)}`, 'error');
                      }
                    }}
                  >
                    {T('ts_unapprove_week', 'Unapprove Week')}
                  </button>
                )}
                {isAdmin && (
                  <button
                    className="btn"
                    style={{ marginLeft: 8 }}
                    onClick={async () => {
                      try {
                        const start = w.week_start;
                        const d = new Date(start);
                        const end = fmtLocal(new Date(d.getFullYear(), d.getMonth(), d.getDate() + 6));
                        const items = await api.getTimesheetsFiltered({
                          fromDate: start,
                          toDate: end,
                          empId: filterEmpId || undefined,
                          approved: false
                        });
                        for (const it of items || []) {
                          // eslint-disable-next-line no-await-in-loop
                          await api.approveTimesheet(it.ts_id);
                        }
                        await loadTimesheets();
                        await loadSummary();
                        await loadWeekly();
                        toast.show(T('ts_approve_success', 'Week approved'));
                      } catch (err) {
                        toast.show(`${T('ts_approve_failed', 'Approve failed')}: ${err.message || String(err)}`, 'error');
                      }
                    }}
                  >
                    {T('ts_approve_week', 'Approve Week')}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingItem ? T('ts_edit', 'Edit') : T('ts_add', 'Add Entry')}</h3>
              <button className="close-btn" onClick={() => setShowForm(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>{T('ts_employee', 'Employee')}</label>
                <select name="emp_id" value={formData.emp_id} onChange={handleInputChange} required>
                  <option value="">{T('ts_select_employee', 'Select employee')}</option>
                  {employees.map((e) => (
                    <option key={e.emp_id} value={e.emp_id}>
                      {e.name} ({e.emp_id})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>{T('ts_date', 'Date')}</label>
                <input type="date" name="ts_date" value={formData.ts_date} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>{T('ts_order', 'Order')}</label>
                <select name="order_id" value={formData.order_id} onChange={handleInputChange}>
                  <option value="">{T('ts_select_order', 'Select order')}</option>
                  {orders.map((o) => (
                    <option key={o.order_id} value={o.order_id}>
                      {o.order_id}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>{T('ts_operation', 'Operation')}</label>
                <input type="number" name="operation_no" value={formData.operation_no} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>{T('ts_hours', 'Hours')}</label>
                <input type="number" name="hours" value={formData.hours} onChange={handleInputChange} step="0.5" required />
              </div>
              <div className="form-group">
                <label>{T('ts_notes', 'Notes')}</label>
                <textarea name="notes" value={formData.notes} onChange={handleInputChange} rows="3" />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {T('ts_save', 'Save')}
                </button>
                <button type="button" className="btn" onClick={() => setShowForm(false)}>
                  {T('ts_cancel', 'Cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="table-container">
        {timesheets.length === 0 ? (
          <p className="empty-message">{T('ts_no_items', 'No entries')}</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>{T('ts_employee', 'Employee')}</th>
                <th>{T('ts_date', 'Date')}</th>
                <th>{T('ts_order', 'Order')}</th>
                <th>{T('ts_operation', 'Operation')}</th>
                <th>{T('ts_hours', 'Hours')}</th>
                <th>{T('ts_notes', 'Notes')}</th>
                <th>{T('ts_actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {timesheets
                .filter((item) => !filterEmpId || item.emp_id === filterEmpId)
                .filter((item) => !approvedOnly || Number(item.approved))
                .filter((item) => !selectedDate || item.ts_date === selectedDate)
                .map((item) => (
                  <tr key={item.ts_id}>
                    <td>
                      {(() => {
                        const e = employees.find((x) => String(x.emp_id) === String(item.emp_id));
                        return e ? e.name || e.emp_id : item.emp_id;
                      })()}
                    </td>
                    <td>{item.ts_date}</td>
                    <td>{item.order_id || '-'}</td>
                    <td>{item.operation_no || '-'}</td>
                    <td>{item.hours}</td>
                    <td>
                      {item.notes || '-'}
                      {Number(item.approved) ? (
                        <span style={{ marginLeft: 8, color: '#16a34a', fontWeight: 600 }}>
                          {T('ts_approved_tag', 'Approved')}
                        </span>
                      ) : null}
                    </td>
                    <td>
                      <button className="btn-sm btn-edit" onClick={() => handleEditClick(item)}>
                        {T('ts_edit', 'Edit')}
                      </button>
                      <button className="btn-sm btn-danger" onClick={() => handleDeleteClick(item.ts_id)}>
                        {T('ts_delete', 'Delete')}
                      </button>
                      {isAdmin && !Number(item.approved) ? (
                        <button
                          className="btn-sm"
                          onClick={async () => {
                            try {
                              await api.approveTimesheet(item.ts_id);
                              await loadTimesheets();
                              await loadSummary();
                              await loadWeekly();
                              toast.show(T('ts_approve_success', 'Timesheet approved'))
                            } catch (err) {
                              toast.show(`${T('ts_approve_failed', 'Approve failed')}: ${err.message || String(err)}`, 'error')
                            }
                          }}
                        >
                          {T('ts_approve', 'Approve')}
                        </button>
                      ) : isAdmin ? (
                        <button
                          className="btn-sm"
                          onClick={async () => {
                            try {
                              await api.unapproveTimesheet(item.ts_id);
                              await loadTimesheets();
                              await loadSummary();
                              await loadWeekly();
                              toast.show(T('ts_unapprove_success', 'Timesheet unapproved'))
                            } catch (err) {
                              toast.show(`${T('ts_unapprove_failed', 'Unapprove failed')}: ${err.message || String(err)}`, 'error')
                            }
                          }}
                        >
                          {T('ts_unapprove', 'Unapprove')}
                        </button>
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
