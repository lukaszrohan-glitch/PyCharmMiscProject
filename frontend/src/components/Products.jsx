import {useState, useEffect} from 'react';
import * as api from '../services/api';
import { useToast } from './Toast';

export default function Products({ lang }) {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    product_id: '',
    name: '',
    unit: 'pcs',
    std_cost: '',
    price: '',
    vat_rate: '23',
    make_or_buy: 'Make'
  });

  const t = lang === 'pl' ? {
    title: 'Produkty',
    productId: 'ID Produktu',
    name: 'Nazwa',
    unit: 'Jednostka',
    stdCost: 'Koszt std.',
    price: 'Cena',
    vatRate: 'VAT %',
    makeOrBuy: 'Make/Buy',
    actions: 'Akcje',
    add: 'Dodaj produkt',
    edit: 'Edytuj',
    delete: 'Usuń',
    save: 'Zapisz',
    cancel: 'Anuluj',
    loading: 'Ładowanie...',
    error: 'Błąd',
    noProducts: 'Brak produktów',
    saveFailed:'Nie udało się zapisać produktu',
    deleteFailed:'Nie udało się usunąć produktu'
  } : {
    title: 'Products',
    productId: 'Product ID',
    name: 'Name',
    unit: 'Unit',
    stdCost: 'Std Cost',
    price: 'Price',
    vatRate: 'VAT %',
    makeOrBuy: 'Make/Buy',
    actions: 'Actions',
    add: 'Add Product',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    loading: 'Loading...',
    error: 'Error',
    noProducts: 'No products',
    saveFailed:'Failed to save product',
    deleteFailed:'Failed to delete product'
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await api.getProducts();
      setProducts(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const closeForm = () => {
    setShowForm(false)
    setEditingProduct(null)
    setFormData({
      product_id: '',
      name: '',
      unit: 'pcs',
      std_cost: '',
      price: '',
      vat_rate: '23',
      make_or_buy: 'Make'
    })
  }

  const handleAddClick = () => {
    setEditingProduct(null);
    setFormData({
      product_id: '',
      name: '',
      unit: 'pcs',
      std_cost: '',
      price: '',
      vat_rate: '23',
      make_or_buy: 'Make'
    });
    setShowForm(true);
  };

  const handleEditClick = (product) => {
    setEditingProduct(product);
    setFormData({
      product_id: product.product_id,
      name: product.name,
      unit: product.unit,
      std_cost: product.std_cost,
      price: product.price,
      vat_rate: product.vat_rate,
      make_or_buy: product.make_or_buy
    });
    setShowForm(true);
  };

  const handleDeleteClick = async (productId) => {
    if (!window.confirm(lang==='pl'?'Usunąć produkt?':'Delete this product?')) return;
    try {
      await api.deleteProduct(productId);
      toast.show(lang==='pl'?'Produkt usunięty':'Product deleted');
      loadProducts();
    } catch (err) {
      toast.show(`${t.deleteFailed}: ${err.message}`, 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.product_id, formData);
        toast.show(lang==='pl'?'Produkt zaktualizowany':'Product updated');
      } else {
        await api.createProduct(formData);
        toast.show(lang==='pl'?'Produkt dodany':'Product added');
      }
      closeForm();
      loadProducts();
    } catch (err) {
      toast.show(`${t.saveFailed}: ${err.message}`, 'error');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (loading) return <div className="loading">{t.loading}</div>;

  return (
    <div className="products-container">
      <div className="products-header">
        <h2>{t.title}</h2>
        <button className="btn btn-primary" onClick={handleAddClick}>{t.add}</button>
      </div>

      {error && <div className="error-message">{t.error}: {error}</div>}

      {showForm && (
        <>
          <button
            type="button"
            className="modal-overlay"
            onClick={closeForm}
            aria-label="Close"
          />
          <div className="modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <h3>{editingProduct ? t.edit : t.add}</h3>
              <button type="button" className="close-btn" onClick={closeForm} aria-label="Close">
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="form">
              <div className="form-group">
                <label>{t.productId}</label>
                <input
                  type="text"
                  name="product_id"
                  value={formData.product_id}
                  onChange={handleInputChange}
                  disabled={!!editingProduct}
                  required
                />
              </div>
              <div className="form-group">
                <label>{t.name}</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>{t.unit}</label>
                <select name="unit" value={formData.unit} onChange={handleInputChange}>
                  <option value="pcs">pcs</option>
                  <option value="kg">kg</option>
                  <option value="l">l</option>
                  <option value="m">m</option>
                  <option value="svc">svc</option>
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>{t.stdCost}</label>
                  <input
                    type="number"
                    name="std_cost"
                    value={formData.std_cost}
                    onChange={handleInputChange}
                    step="0.01"
                  />
                </div>
                <div className="form-group">
                  <label>{t.price}</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    step="0.01"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>{t.vatRate}</label>
                  <input
                    type="number"
                    name="vat_rate"
                    value={formData.vat_rate}
                    onChange={handleInputChange}
                    step="0.1"
                  />
                </div>
                <div className="form-group">
                  <label>{t.makeOrBuy}</label>
                  <select name="make_or_buy" value={formData.make_or_buy} onChange={handleInputChange}>
                    <option value="Make">Make</option>
                    <option value="Buy">Buy</option>
                  </select>
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">{t.save}</button>
                <button type="button" className="btn" onClick={closeForm}>{t.cancel}</button>
              </div>
            </form>
          </div>
        </>
      )}

      <div className="table-container">
        {products.length === 0 ? (
          <p className="empty-message">{t.noProducts}</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>{t.productId}</th>
                <th>{t.name}</th>
                <th>{t.unit}</th>
                <th>{t.stdCost}</th>
                <th>{t.price}</th>
                <th>{t.vatRate}</th>
                <th>{t.makeOrBuy}</th>
                <th>{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.product_id}>
                  <td>{product.product_id}</td>
                  <td>{product.name}</td>
                  <td>{product.unit}</td>
                  <td>{parseFloat(product.std_cost).toFixed(2)}</td>
                  <td>{parseFloat(product.price).toFixed(2)}</td>
                  <td>{product.vat_rate}%</td>
                  <td>{product.make_or_buy}</td>
                  <td>
                    <button className="btn-sm btn-edit" onClick={() => handleEditClick(product)}>{t.edit}</button>
                    <button className="btn-sm btn-danger" onClick={() => handleDeleteClick(product.product_id)}>{t.delete}</button>
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
