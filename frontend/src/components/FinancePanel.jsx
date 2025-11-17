import React from 'react'

export default function FinancePanel({ orderId, finance, lang }) {
  const t = lang === 'pl' ? {
    finance: 'Finanse',
    order: 'Zamówienie',
    revenue: 'Przychód',
    materialCost: 'Koszt materiałów',
    laborCost: 'Koszt pracy',
    grossMargin: 'Marża brutto',
    noData: 'Brak danych finansowych',
    currency: 'PLN'
  } : {
    finance: 'Finance',
    order: 'Order',
    revenue: 'Revenue',
    materialCost: 'Material Cost',
    laborCost: 'Labor Cost',
    grossMargin: 'Gross Margin',
    noData: 'No financial data available',
    currency: 'PLN'
  }

  const formatCurrency = (value) => {
    if (!value) return '—'
    const num = parseFloat(value)
    return new Intl.NumberFormat(lang, {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num)
  }

  const calculateMarginPercent = () => {
    if (!finance?.revenue || !finance?.gross_margin) return null
    const percent = (parseFloat(finance.gross_margin) / parseFloat(finance.revenue)) * 100
    return percent.toFixed(1) + '%'
  }

  if (!finance) {
    return (
      <div className="finance-empty">
        <p>{t.noData}</p>
      </div>
    )
  }

  const marginPercent = calculateMarginPercent()

  return (
    <div className="finance-display">
      <h2>{t.finance}: {orderId}</h2>

      <div className="finance-grid">
        <div className="finance-card revenue">
          <div className="card-icon">💰</div>
          <div className="card-content">
            <label>{t.revenue}</label>
            <div className="card-value">{formatCurrency(finance.revenue)}</div>
          </div>
        </div>

        <div className="finance-card cost">
          <div className="card-icon">📦</div>
          <div className="card-content">
            <label>{t.materialCost}</label>
            <div className="card-value">{formatCurrency(finance.material_cost)}</div>
          </div>
        </div>

        <div className="finance-card cost">
          <div className="card-icon">👷</div>
          <div className="card-content">
            <label>{t.laborCost}</label>
            <div className="card-value">{formatCurrency(finance.labor_cost)}</div>
          </div>
        </div>

        <div className="finance-card margin">
          <div className="card-icon">📊</div>
          <div className="card-content">
            <label>{t.grossMargin}</label>
            <div className="card-value">
              {formatCurrency(finance.gross_margin)}
              {marginPercent && <span className="margin-percent">({marginPercent})</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

