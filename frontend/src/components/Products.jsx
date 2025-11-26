import { useState, useEffect, useCallback, useMemo } from 'react'
import * as api from '../services/api'
import { useI18n } from '../i18n'
import { useToast } from '../lib/toastContext'
import ModalOverlay from './ModalOverlay'
import LoadingSpinner from './LoadingSpinner'
import styles from './Products.module.css'

export default function Products() {
  const { t } = useI18n()
  const { addToast } = useToast()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState({
    product_id: '',
    name: '',
    description: '',
    category: '',
    unit: 'szt',
    price: '',
    cost: '',
    stock_min: '',
    stock_max: '',
    lead_time_days: '',
    active: true
  })

  const labels = useMemo(() => ({
    pl: {
      title: 'Produkty',
      search: 'Szukaj produktów...',
      addProduct: 'Dodaj produkt',
      edit: 'Edytuj',
      delete: 'Usuń',
      save: 'Zapisz',
      cancel: 'Anuluj',
      productId: 'ID produktu',
      name: 'Nazwa',
      description: 'Opis',
      category: 'Kategoria',
      unit: 'Jednostka',
      price: 'Cena sprzedaży',
      cost: 'Koszt',
      stockMin: 'Min. stan magazynowy',
      stockMax: 'Maks. stan magazynowy',
      leadTime: 'Czas realizacji (dni)',
      active: 'Aktywny',
      allCategories: 'Wszystkie kategorie',
      rawMaterial: 'Surowce',
      semifinished: 'Półprodukty',
      finished: 'Produkty gotowe',
      service: 'Usługi',
      noProducts: 'Brak produktów',
      confirmDelete: 'Czy na pewno chcesz usunąć ten produkt?',
      productAdded: 'Produkt dodany pomyślnie',
      productUpdated: 'Produkt zaktualizowany',
      productDeleted: 'Produkt usunięty',
      errorLoading: 'Błąd wczytywania produktów',
      errorSaving: 'Błąd zapisywania produktu',
      margin: 'Marża',
      stock: 'Stan magazynowy'
    },
    en: {
      title: 'Products',
      search: 'Search products...',
      addProduct: 'Add Product',
      edit: 'Edit',
      delete: 'Delete',
      save: 'Save',
      cancel: 'Cancel',
      productId: 'Product ID',
      name: 'Name',
      description: 'Description',
      category: 'Category',
      unit: 'Unit',
      price: 'Sale Price',
      cost: 'Cost',
      stockMin: 'Min. Stock',
      stockMax: 'Max. Stock',
      leadTime: 'Lead Time (days)',
      active: 'Active',
      allCategories: 'All Categories',
      rawMaterial: 'Raw Materials',
      semifinished: 'Semi-finished',
      finished: 'Finished Products',
      service: 'Services',
      noProducts: 'No products',
      confirmDelete: 'Are you sure you want to delete this product?',
      productAdded: 'Product added successfully',
      productUpdated: 'Product updated successfully',
      productDeleted: 'Product deleted successfully',
      errorLoading: 'Error loading products',
      errorSaving: 'Error saving product',
      margin: 'Margin',
      stock: 'Stock'
    }
  }), [])

  const l = labels[t.currentLang] || labels.pl

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true)
      const data = await api.getProducts()
      setProducts(data)
    } catch (err) {
      addToast(l.errorLoading, 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast, l.errorLoading])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch =
        p.product_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter

      return matchesSearch && matchesCategory
    })
  }, [products, searchTerm, categoryFilter])

  const handleAdd = () => {
    setEditingProduct(null)
    setFormData({
      product_id: '',
      name: '',
      description: '',
      category: 'finished',
      unit: 'szt',
      price: '',
      cost: '',
      stock_min: '',
      stock_max: '',
      lead_time_days: '',
      active: true
    })
    setShowAddModal(true)
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setFormData({
      product_id: product.product_id || '',
      name: product.name || '',
      description: product.description || '',
      category: product.category || 'finished',
      unit: product.unit || 'szt',
      price: product.price || '',
      cost: product.cost || '',
      stock_min: product.stock_min || '',
      stock_max: product.stock_max || '',
      lead_time_days: product.lead_time_days || '',
      active: product.active !== false
    })
    setShowAddModal(true)
  }

  const handleSave = async () => {
    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.product_id, formData)
        addToast(l.productUpdated, 'success')
      } else {
        await api.createProduct(formData)
        addToast(l.productAdded, 'success')
      }
      await loadProducts()
      setShowAddModal(false)
    } catch (err) {
      addToast(l.errorSaving, 'error')
    }
  }

  const handleDelete = async (productId) => {
    if (!window.confirm(l.confirmDelete)) return
    try {
      await api.deleteProduct(productId)
      addToast(l.productDeleted, 'success')
      await loadProducts()
    } catch (err) {
      addToast(l.errorSaving, 'error')
    }
  }

  const calculateMargin = (price, cost) => {
    if (!price || !cost) return '—'
    const margin = ((parseFloat(price) - parseFloat(cost)) / parseFloat(price)) * 100
    return `${margin.toFixed(1)}%`
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>{l.title}</h1>
        <button className="btn btn-primary" onClick={handleAdd}>
          + {l.addProduct}
        </button>
      </div>

      <div className={styles.filters}>
        <input
          type="text"
          placeholder={l.search}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className={styles.categorySelect}
        >
          <option value="all">{l.allCategories}</option>
          <option value="raw_material">{l.rawMaterial}</option>
          <option value="semifinished">{l.semifinished}</option>
          <option value="finished">{l.finished}</option>
          <option value="service">{l.service}</option>
        </select>
      </div>

      {filteredProducts.length === 0 ? (
        <div className={styles.empty}>{l.noProducts}</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{l.productId}</th>
                <th>{l.name}</th>
                <th>{l.category}</th>
                <th>{l.unit}</th>
                <th>{l.price}</th>
                <th>{l.cost}</th>
                <th>{l.margin}</th>
                <th>{l.stock}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.product_id}>
                  <td>{product.product_id}</td>
                  <td>
                    <div className={styles.productName}>{product.name}</div>
                    {product.description && (
                      <div className={styles.productDesc}>{product.description}</div>
                    )}
                  </td>
                  <td>{product.category}</td>
                  <td>{product.unit}</td>
                  <td>{product.price ? `${parseFloat(product.price).toFixed(2)} zł` : '—'}</td>
                  <td>{product.cost ? `${parseFloat(product.cost).toFixed(2)} zł` : '—'}</td>
                  <td>{calculateMargin(product.price, product.cost)}</td>
                  <td>{product.current_stock || 0}</td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleEdit(product)}
                      >
                        {l.edit}
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(product.product_id)}
                      >
                        {l.delete}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && (
        <ModalOverlay onClose={() => setShowAddModal(false)}>
          <div className={styles.modal}>
            <h2>{editingProduct ? l.edit : l.addProduct}</h2>
            <form className={styles.form} onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <div className={styles.formRow}>
                <label>
                  {l.productId}
                  <input
                    type="text"
                    value={formData.product_id}
                    onChange={(e) => setFormData({...formData, product_id: e.target.value})}
                    required
                    disabled={!!editingProduct}
                  />
                </label>
                <label>
                  {l.name}
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </label>
              </div>

              <label>
                {l.description}
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </label>

              <div className={styles.formRow}>
                <label>
                  {l.category}
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  >
                    <option value="raw_material">{l.rawMaterial}</option>
                    <option value="semifinished">{l.semifinished}</option>
                    <option value="finished">{l.finished}</option>
                    <option value="service">{l.service}</option>
                  </select>
                </label>
                <label>
                  {l.unit}
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                  />
                </label>
              </div>

              <div className={styles.formRow}>
                <label>
                  {l.price}
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                  />
                </label>
                <label>
                  {l.cost}
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({...formData, cost: e.target.value})}
                  />
                </label>
              </div>

              <div className={styles.formRow}>
                <label>
                  {l.stockMin}
                  <input
                    type="number"
                    value={formData.stock_min}
                    onChange={(e) => setFormData({...formData, stock_min: e.target.value})}
                  />
                </label>
                <label>
                  {l.stockMax}
                  <input
                    type="number"
                    value={formData.stock_max}
                    onChange={(e) => setFormData({...formData, stock_max: e.target.value})}
                  />
                </label>
              </div>

              <label>
                {l.leadTime}
                <input
                  type="number"
                  value={formData.lead_time_days}
                  onChange={(e) => setFormData({...formData, lead_time_days: e.target.value})}
                />
              </label>

              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({...formData, active: e.target.checked})}
                />
                {l.active}
              </label>

              <div className={styles.modalActions}>
                <button type="submit" className="btn btn-primary">{l.save}</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  {l.cancel}
                </button>
              </div>
            </form>
          </div>
        </ModalOverlay>
      )}
    </div>
  )
}

