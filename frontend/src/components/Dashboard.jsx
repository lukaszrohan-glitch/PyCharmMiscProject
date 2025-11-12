import React from 'react';
import styles from '../App.module.css';

export default function Dashboard({ lang, setCurrentView }) {
  const handleCardClick = (view) => {
    setCurrentView(view);
  };

  return (
    <>
      <div className={styles.hero}>
        <h1 className={styles.heroTitle}>
          {lang === 'pl' ? 'Witamy w Arkuszownia SMB' : 'Welcome to Arkuszownia SMB'}
        </h1>
        <p className={styles.heroSubtitle}>
          {lang === 'pl'
            ? 'System zarządzania produkcją dla małych i średnich przedsiębiorstw'
            : 'Manufacturing management system for small and medium enterprises'}
        </p>
      </div>

      <div className={styles.cards}>
        <div className={styles.card} onClick={() => handleCardClick('orders')}>
          <div className={styles.cardIcon}>📋</div>
          <h3 className={styles.cardTitle}>
            {lang === 'pl' ? 'Zamówienia' : 'Orders'}
          </h3>
          <p className={styles.cardText}>
            {lang === 'pl'
              ? 'Zarządzaj zamówieniami klientów'
              : 'Manage customer orders'}
          </p>
        </div>

        <div className={styles.card} onClick={() => handleCardClick('inventory')}>
          <div className={styles.cardIcon}>📦</div>
          <h3 className={styles.cardTitle}>
            {lang === 'pl' ? 'Magazyn' : 'Inventory'}
          </h3>
          <p className={styles.cardText}>
            {lang === 'pl'
              ? 'Kontroluj stany magazynowe'
              : 'Control inventory levels'}
          </p>
        </div>

        <div className={styles.card} onClick={() => handleCardClick('timesheets')}>
          <div className={styles.cardIcon}>⏱️</div>
          <h3 className={styles.cardTitle}>
            {lang === 'pl' ? 'Czas pracy' : 'Timesheets'}
          </h3>
          <p className={styles.cardText}>
            {lang === 'pl'
              ? 'Monitoruj czas pracowników'
              : 'Monitor employee time'}
          </p>
        </div>

        <div className={styles.card} onClick={() => handleCardClick('reports')}>
          <div className={styles.cardIcon}>📈</div>
          <h3 className={styles.cardTitle}>
            {lang === 'pl' ? 'Raporty' : 'Reports'}
          </h3>
          <p className={styles.cardText}>
            {lang === 'pl'
              ? 'Analizuj wyniki działalności'
              : 'Analyze business results'}
          </p>
        </div>
      </div>

      <div className={styles.status}>
        <div className={styles.statusBadge}>
          <span className={styles.statusDot}></span>
          <span className={styles.statusText}>
            {lang === 'pl' ? 'System działa poprawnie' : 'System operational'}
          </span>
        </div>
      </div>
    </>
  );
}
