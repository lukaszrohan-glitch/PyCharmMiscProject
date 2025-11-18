import React, { useEffect, useState } from 'react'
import * as api from '../services/api'

export default function Clients({ lang }) {
  const [items, setItems] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ customer_id:'', name:'', nip:'', address:'', email:'', contact_person:'' })
  const [loading, setLoading] = useState(false)

  const t = lang === 'pl' ? {
    title:'Klienci', add:'Dodaj klienta', edit:'Edytuj', del:'Usuń', save:'Zapisz', cancel:'Anuluj',
    customer_id:'ID klienta', name:'Nazwa', nip:'NIP', address:'Adres', email:'Email', actions:'Akcje', noItems:'Brak klientów'
  } : {
    title:'Clients', add:'Add client', edit:'Edit', del:'Delete', save:'Save', cancel:'Cancel',
    customer_id:'Customer ID', name:'Name', nip:'VAT', address:'Address', email:'Email', actions:'Actions', noItems:'No customers'
  }

  useEffect(()=>{ load() }, [])
  async function load(){ try{ setItems(await api.getCustomers()||[]) } catch(e){ console.error(e) } }

  function openAdd(){ setEditing(null); setForm({ customer_id:'', name:'', nip:'', address:'', email:'' }); setShowForm(true) }
  function openEdit(row){ setEditing(row); setForm({ customer_id:row.customer_id, name:row.name||'', nip:row.nip||'', address:row.address||'', email:row.email||'', contact_person:row.contact_person||'' }); setShowForm(true) }

  async function submit(e){ e.preventDefault(); if(loading) return; setLoading(true)
    try{
      if(editing){ await api.updateCustomer(form.customer_id, form) } else { await api.createCustomer(form) }
      setShowForm(false); await load()
    } catch(err){ alert('Client save failed: '+err.message) } finally { setLoading(false) }
  }
  async function remove(id){ if(!confirm('Delete?')) return; try{ await api.deleteCustomer(id); await load() } catch(err){ alert('Delete failed: '+err.message) } }

  return (
    <div className="customers">
      <div className="customers-header">
        <h2>{t.title}</h2>
        <button className="btn btn-primary" onClick={openAdd}>{t.add}</button>
      </div>

      {items.length===0 ? (
        <p className="empty-message">{t.noItems}</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>{t.customer_id}</th>
              <th>{t.name}</th>
              <th>{t.nip}</th>
              <th>{t.address}</th>
              <th>{t.email}</th>
              <th>POC</th>
              <th style={{textAlign:'right'}}>{t.actions}</th>
            </tr>
          </thead>
          <tbody>
            {items.map(r=> (
              <tr key={r.customer_id}>
                <td>{r.customer_id}</td>
                <td>{r.name}</td>
                <td>{r.nip||'-'}</td>
                <td>{r.address||'-'}</td>
                <td>{r.email||'-'}</td>
                <td>{r.contact_person||'-'}</td>
                <td style={{textAlign:'right'}}>
                  <button className="btn-sm btn-edit" onClick={()=>openEdit(r)}>{t.edit}</button>
                  <button className="btn-sm btn-danger" onClick={()=>remove(r.customer_id)}>{t.del}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={()=>setShowForm(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? t.edit : t.add}</h3>
              <button className="close-btn" onClick={()=>setShowForm(false)}>×</button>
            </div>
            <form className="form" onSubmit={submit}>
              <div className="form-group">
                <label>{t.customer_id}</label>
                <input value={form.customer_id} onChange={e=>setForm({...form, customer_id:e.target.value})} required disabled={!!editing} />
              </div>
              <div className="form-group">
                <label>{t.name}</label>
                <input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required />
              </div>
              <div className="form-group">
                <label>{t.nip}</label>
                <input value={form.nip} onChange={e=>setForm({...form, nip:e.target.value})} />
              </div>
              <div className="form-group">
                <label>{t.address}</label>
                <input value={form.address} onChange={e=>setForm({...form, address:e.target.value})} />
              </div>
              <div className="form-group">
                <label>{t.email}</label>
                <input type="email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} />
              </div>
              <div className="form-group">
                <label>POC</label>
                <input value={form.contact_person} onChange={e=>setForm({...form, contact_person:e.target.value})} />
              </div>
              <div className="form-actions">
                <button className="btn btn-primary" type="submit" disabled={loading}>{t.save}</button>
                <button className="btn btn-sm" type="button" onClick={()=>setShowForm(false)}>{t.cancel}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
