/**
 * Animated Components Library
 * Reusable animation wrappers using Framer Motion
 */
import { motion, AnimatePresence } from 'framer-motion';
import { forwardRef } from 'react';
import { staggerItemVariants } from '../lib/animationVariants';

/**
 * FadeIn wrapper component
 */
export function FadeIn({
  children,
  delay = 0,
  duration = 0.3,
  className = '',
  ...props
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration, delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * SlideUp wrapper component
 */
export function SlideUp({
  children,
  delay = 0,
  duration = 0.3,
  className = '',
  ...props
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration, delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * ScaleIn wrapper component
 */
export function ScaleIn({
  children,
  delay = 0,
  duration = 0.3,
  className = '',
  ...props
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration, delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Stagger container for list animations
 */
export function StaggerContainer({
  children,
  className = '',
  staggerDelay = 0.05,
  ...props
}) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={{
        animate: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Stagger item - use inside StaggerContainer
 */
export function StaggerItem({
  children,
  className = '',
  ...props
}) {
  return (
    <motion.div
      variants={staggerItemVariants}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Animated button with hover/tap effects
 */
export const AnimatedButton = forwardRef(function AnimatedButton(
  { children, className = '', whileHover, whileTap, ...props },
  ref
) {
  return (
    <motion.button
      ref={ref}
      whileHover={whileHover || { scale: 1.02 }}
      whileTap={whileTap || { scale: 0.98 }}
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  );
});

/**
 * Animated card with hover effects
 */
export function AnimatedCard({
  children,
  className = '',
  hoverScale = 1.02,
  ...props
}) {
  return (
    <motion.div
      whileHover={{
        scale: hoverScale,
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
      }}
      transition={{ duration: 0.2 }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Page transition wrapper
 */
export function PageTransition({ children, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Modal/Dialog animation wrapper
 */
export function ModalAnimation({
  isOpen,
  onClose,
  children,
  className = ''
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 999,
            }}
          />
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className={className}
            style={{
              position: 'fixed',
              zIndex: 1000,
            }}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * Number counter animation
 */
export function AnimatedNumber({
  value,
  duration = 0.5,
  className = '',
  formatFn = (v) => Math.round(v),
}) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration }}
      >
        {formatFn(value)}
      </motion.span>
    </motion.span>
  );
}

/**
 * Collapse/Expand animation
 */
export function Collapse({ isOpen, children, className = '' }) {
  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          style={{ overflow: 'hidden' }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Skeleton pulse animation (pure CSS alternative to Skeleton component)
 */
export function SkeletonPulse({
  width = '100%',
  height = '1rem',
  borderRadius = '4px',
  className = '',
}) {
  return (
    <motion.div
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      className={className}
      style={{
        width,
        height,
        borderRadius,
        background: 'var(--bg-tertiary, #f3f4f6)',
      }}
    />
  );
}

// Re-export AnimatePresence for convenience
export { AnimatePresence } from 'framer-motion';
