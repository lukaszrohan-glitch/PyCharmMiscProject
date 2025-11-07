import React, { useState } from 'react'
import Autocomplete from './components/Autocomplete'

export default function OrderLinesEditor({ products = [], onAdd, orders = [], toast }){
  const [orderId, setOrderId] = useState('')
  const [product, setProduct] = useState('')
  const [qty, setQty] = useState('')
  const [unitPrice, setUnitPrice] = useState('')

  function submit(e){
    e.preventDefault()
    if(!orderId || !product || !qty) return
    if(!confirm(`Add line to ${orderId}?`)) return
    onAdd({ order_id: orderId, line_no: 1, product_id: product, qty: Number(qty), unit_price: unitPrice ? Number(unitPrice) : 0 })
    toast && toast.show('Order line added')
    setProduct(''); setQty(''); setUnitPrice('')
  }

  return (
    <form onSubmit={submit} style={{display:'flex',flexDirection:'column',gap:8}} data-testid="order-line-form">
      <Autocomplete
        items={orders}
        getLabel={o=> `${o.order_id} — ${o.status}`}
        inputValue={orderId}
        onInputChange={setOrderId}
        onSelect={o=> setOrderId(o.order_id)}
        placeholder="Order (type to filter)"
        testId="ac-order"
      />
      <Autocomplete
        items={products}
        getLabel={p=> `${p.product_id} — ${p.name}`}
        inputValue={product}
        onInputChange={setProduct}
        onSelect={p=> setProduct(p.product_id)}
        placeholder="Product (type to filter)"
        testId="ac-product"
      />
      <input placeholder="Qty" value={qty} onChange={e=>setQty(e.target.value)} data-testid="line-qty" />
      <input placeholder="Unit price" value={unitPrice} onChange={e=>setUnitPrice(e.target.value)} data-testid="line-price" />
      <button type="submit" data-testid="line-submit">Add Line</button>
    </form>
  )
}
