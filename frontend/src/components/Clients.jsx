import {useEffect, useState} from 'react';
import * as api from '../services/api'
import { useToast } from '../lib/toastContext'
import ModalOverlay from './ModalOverlay'

const CUSTOMER_ID_MAX = 24
const CONTACT_MAX = 80

export default function Clients({ lang }) {
  const toast = useToast()
  const [items, setItems] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ customer_id:'', name:'', nip:'', address:'', email:'', contact_person:'' })
  const [loading, setLoading] = useState(false)

  const t = lang === 'pl' ? {
    title:'Klienci', add:'Dodaj klienta', edit:'Edytuj', del:'Usuń', save:'Zapisz', cancel:'Anuluj',
    customer_id:'ID klienta', name:'Nazwa', nip:'NIP', address:'Adres', email:'Email', actions:'Akcje', noItems:'Brak klientów',
    saved:'Zapisano',
    saveFailed:'Nie udało się zapisać',
    deleted:'Usunięto',
    deleteFailed:'Nie udało się usunąć'
  } : {
    title:'Clients', add:'Add client', edit:'Edit', del:'Delete', save:'Save', cancel:'Cancel',
    customer_id:'Customer ID', name:'Name', nip:'VAT', address:'Address', email:'Email', actions:'Actions', noItems:'No customers',
    saved:'Saved',
    saveFailed:'Save failed',
    deleted:'Deleted',
    deleteFailed:'Delete failed'
  }

  useEffect(()=>{ load() }, [])
  async function load(){ try{ setItems(await api.getCustomers()||[]) } catch(e){ console.error(e) } }

  function openAdd(){ setEditing(null); setForm({ customer_id:'', name:'', nip:'', address:'', email:'', contact_person:'' }); setShowForm(true) }
  function openEdit(row){ setEditing(row); setForm({ customer_id:row.customer_id, name:row.name||'', nip:row.nip||'', address:row.address||'', email:row.email||'', contact_person:row.contact_person||'' }); setShowForm(true) }

  async function submit(e){ e.preventDefault(); if(loading) return; setLoading(true)
    try{
      const payload = { ...form }
      if(!editing){ delete payload.customer_id }
      if(editing){ await api.updateCustomer(form.customer_id, payload); toast.show(t.saved) }
      else { await api.createCustomer(payload); toast.show(t.saved) }
      setShowForm(false); await load()
    } catch(err){ toast.show(t.saveFailed+': '+err.message, 'error') } finally { setLoading(false) }
  }
  async function remove(id){ if(!confirm('Delete?')) return; try{ await api.deleteCustomer(id); toast.show(t.deleted) ; await load() } catch(err){ toast.show(t.deleteFailed+': '+err.message, 'error') } }

  const handleInput = (e) => {
    const { name, value } = e.target
    if (name === 'customer_id' && value.length > CUSTOMER_ID_MAX) return
    if (name === 'contact_person' && value.length > CONTACT_MAX) return
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const closeForm = () => setShowForm(false)

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
        <ModalOverlay ariaLabel={t.cancel} onClose={closeForm}>
          <div className="modal" role="dialog" aria-modal="true">
             <div className="modal-header">
               <h3>{editing ? t.edit : t.add}</h3>
               <button className="close-btn" type="button" onClick={closeForm} aria-label={t.cancel}>×</button>
             </div>
             <form className="form" onSubmit={submit}>
              <div className="form-group">
                <label htmlFor="customer_id_field">{t.customer_id}</label>
                <input id="customer_id_field" value={form.customer_id} onChange={handleInput} name="customer_id" required disabled={!!editing} maxLength={CUSTOMER_ID_MAX} />
              </div>
              <div className="form-group">
                <label htmlFor="name_field">{t.name}</label>
                <input id="name_field" value={form.name} onChange={handleInput} name="name" required />
              </div>
              <div className="form-group">
                <label htmlFor="nip_field">{t.nip}</label>
                <input id="nip_field" value={form.nip} onChange={handleInput} name="nip" />
              </div>
              <div className="form-group">
                <label htmlFor="address_field">{t.address}</label>
                <input id="address_field" value={form.address} onChange={handleInput} name="address" />
              </div>
              <div className="form-group">
                <label htmlFor="email_field">{t.email}</label>
                <input id="email_field" type="email" value={form.email} onChange={handleInput} name="email" />
              </div>
              <div className="form-group">
                <label htmlFor="poc_field">POC</label>
                <input id="poc_field" value={form.contact_person} onChange={handleInput} name="contact_person" maxLength={CONTACT_MAX} />
              </div>
              <div className="form-actions">
                <button className="btn btn-primary" type="submit" disabled={loading}>{t.save}</button>
                <button className="btn btn-sm" type="button" onClick={closeForm}>{t.cancel}</button>
              </div>
            </form>
           </div>
         </ModalOverlay>
       )}
    </div>
  )
}
