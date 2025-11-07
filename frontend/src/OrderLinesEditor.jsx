import React, { useState } from 'react'

export default function OrderLinesEditor({ products = [], onAdd }){
  const [orderId, setOrderId] = useState('')
  const [product, setProduct] = useState('')
  const [qty, setQty] = useState('')
  const [unitPrice, setUnitPrice] = useState('')

  function submit(e){
    e.preventDefault()
    if(!orderId || !product || !qty) return
    onAdd({ order_id: orderId, line_no: 1, product_id: product, qty: Number(qty), unit_price: unitPrice ? Number(unitPrice) : 0 })
    setProduct(''); setQty(''); setUnitPrice('')
  }

  return (
    <form onSubmit={submit} style={{display:'flex',gap:8,alignItems:'center'}}>
      <input placeholder="Order ID" value={orderId} onChange={e=>setOrderId(e.target.value)} />
      <select value={product} onChange={e=>setProduct(e.target.value)}>
        <option value="">-- product --</option>
        {products.map(p=> <option key={p.product_id} value={p.product_id}>{p.product_id} — {p.name}</option>)}
      </select>
      <input placeholder="Qty" value={qty} onChange={e=>setQty(e.target.value)} />
      <input placeholder="Unit price" value={unitPrice} onChange={e=>setUnitPrice(e.target.value)} />
      <button type="submit">Add Line</button>
    </form>
  )
}

