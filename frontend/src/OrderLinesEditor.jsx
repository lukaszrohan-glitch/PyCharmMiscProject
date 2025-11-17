import React, { useState } from 'react'
import Autocomplete from './components/Autocomplete'
import { useI18n } from './i18n.jsx'

export default function OrderLinesEditor({ products = [], onAdd, orders = [], toast }) {
  const { t } = useI18n()
  const [orderId, setOrderId] = useState('')
  const [product, setProduct] = useState('')
  const [qty, setQty] = useState('')
  const [unitPrice, setUnitPrice] = useState('')

  function submit(e) {
    e.preventDefault()
    // Validate required fields
    if (!orderId || !product || !qty) return
    if (!confirm(t('add_line_confirm').replace('{orderId}', orderId))) return
    onAdd({
      order_id: orderId,
      line_no: 1, // Could be extended later
      product_id: product,
      qty: Number(qty),
      unit_price: unitPrice ? Number(unitPrice) : 0
    })
    toast && toast.show(t('order_line_added'))
    setProduct('')
    setQty('')
    setUnitPrice('')
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }} data-testid="order-line-form">
      <Autocomplete
        items={orders}
        getLabel={o => `${o.order_id} — ${o.status}`}
        inputValue={orderId}
        onInputChange={setOrderId}
        onSelect={o => setOrderId(o.order_id)}
        placeholder={t('order_filter')}
        testId="ac-order"
      />
      <Autocomplete
        items={products}
        getLabel={p => `${p.product_id} — ${p.name}`}
        inputValue={product}
        onInputChange={setProduct}
        onSelect={p => setProduct(p.product_id)}
        placeholder={t('product_filter')}
        testId="ac-product"
      />
      <input
        placeholder={t('qty')}
        value={qty}
        onChange={(e) => setQty(e.target.value)}
        data-testid="line-qty"
      />
      <input
        placeholder={t('unit_price')}
        value={unitPrice}
        onChange={(e) => setUnitPrice(e.target.value)}
        data-testid="line-price"
      />
      <button type="submit" data-testid="line-submit">{t('add_line')}</button>
    </form>
  )
}
