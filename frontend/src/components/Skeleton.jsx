/**
 * Skeleton loading components for perceived performance
 * Usage:
 *   <Skeleton /> - default line skeleton
 *   <Skeleton.Card /> - card shaped skeleton
 *   <Skeleton.Table rows={5} cols={4} /> - table skeleton
 *   <Skeleton.Text lines={3} /> - multi-line text skeleton
 *   <Skeleton.Avatar size="lg" /> - circular avatar skeleton
 */
import styles from './Skeleton.module.css';

function SkeletonBase({ className = '', style = {}, ...props }) {
  return (
    <div
      className={`${styles.skeleton} ${className}`}
      style={style}
      aria-hidden="true"
      {...props}
    />
  );
}

function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`${styles.textGroup} ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={styles.skeleton}
          style={{
            width: i === lines - 1 ? '60%' : '100%',
            height: '1em'
          }}
        />
      ))}
    </div>
  );
}

function SkeletonCard({ className = '' }) {
  return (
    <div className={`${styles.card} ${className}`} aria-hidden="true">
      <div className={styles.cardHeader}>
        <div className={`${styles.skeleton} ${styles.avatarMd}`} />
        <div className={styles.cardHeaderText}>
          <div className={styles.skeleton} style={{ width: '70%', height: '1em' }} />
          <div className={styles.skeleton} style={{ width: '50%', height: '0.875em' }} />
        </div>
      </div>
      <div className={styles.cardBody}>
        <SkeletonText lines={2} />
      </div>
    </div>
  );
}

function SkeletonTable({ rows = 5, cols = 4, className = '' }) {
  return (
    <div className={`${styles.table} ${className}`} aria-hidden="true" role="presentation">
      <div className={styles.tableHeader}>
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className={styles.skeleton} style={{ height: '1em' }} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className={styles.tableRow}>
          {Array.from({ length: cols }).map((_, colIdx) => (
            <div
              key={colIdx}
              className={styles.skeleton}
              style={{
                height: '1em',
                width: colIdx === 0 ? '80%' : '100%'
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function SkeletonAvatar({ size = 'md', className = '' }) {
  const sizeClass = styles[`avatar${size.charAt(0).toUpperCase() + size.slice(1)}`];
  return <div className={`${styles.skeleton} ${styles.circle} ${sizeClass} ${className}`} aria-hidden="true" />;
}

function SkeletonDashboard({ className = '' }) {
  return (
    <div className={`${styles.dashboard} ${className}`} aria-hidden="true">
      {/* Stats row */}
      <div className={styles.statsRow}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={styles.statCard}>
            <div className={styles.skeleton} style={{ width: '60%', height: '0.75em' }} />
            <div className={styles.skeleton} style={{ width: '80%', height: '2em', marginTop: '0.5rem' }} />
          </div>
        ))}
      </div>
      {/* Grid of tiles */}
      <div className={styles.tilesGrid}>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className={styles.tile}>
            <div className={`${styles.skeleton} ${styles.circle}`} style={{ width: '48px', height: '48px' }} />
            <div className={styles.skeleton} style={{ width: '70%', height: '1em', marginTop: '0.75rem' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function SkeletonList({ items = 5, className = '' }) {
  return (
    <div className={`${styles.list} ${className}`} aria-hidden="true">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className={styles.listItem}>
          <div className={`${styles.skeleton} ${styles.circle} ${styles.avatarSm}`} />
          <div className={styles.listItemContent}>
            <div className={styles.skeleton} style={{ width: '60%', height: '1em' }} />
            <div className={styles.skeleton} style={{ width: '40%', height: '0.875em' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// Attach sub-components
SkeletonBase.Text = SkeletonText;
SkeletonBase.Card = SkeletonCard;
SkeletonBase.Table = SkeletonTable;
SkeletonBase.Avatar = SkeletonAvatar;
SkeletonBase.Dashboard = SkeletonDashboard;
SkeletonBase.List = SkeletonList;

export default SkeletonBase;

