import React, { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "../i18n";
import clsx from 'clsx';
import { useTheme } from "../hooks/useTheme";
import styles from "./Header.module.css";

export default function Header({ lang, setLang, currentView, setCurrentView, profile, onSettings, onLogout, orders }) {
  const menuBtnRef = useRef(null);
  const menuRef = useRef(null);
  const { t } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  // Handle menu clicks outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuOpen && !menuRef.current?.contains(event.target) && !menuBtnRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyboard = (event) => {
      if (event.key === "Escape" && menuOpen) {
        setMenuOpen(false);
      }
      if (event.key === "/" && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        const searchInput = document.querySelector('[data-search]');
        searchInput?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyboard);
    return () => document.removeEventListener("keydown", handleKeyboard);
  }, [menuOpen]);

  // Calculate stats
  const pendingOrders = useMemo(() =>
    orders?.filter(o => o.status === "New").length || 0
  , [orders]);

  // Navigation items with icons
  const navItems = [
    { id: "dashboard", icon: "📊", badge: null },
    { id: "orders", icon: "📋", badge: pendingOrders },
    { id: "inventory", icon: "📦", badge: null },
    { id: "timesheets", icon: "⏱️", badge: null },
    { id: "reports", icon: "📈", badge: null }
  ];

  return (
    <header className={styles.appHeader}>
      <a href="#main-content" className={styles.skipLink}>
        {t("skip_to_content")}
      </a>

      <div className={styles.headerTop}>
        <div className={styles.headerContent}>
          <div className={styles.logoSection}>
            <svg className={styles.logoIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M7 8h10M7 12h10M7 16h6" />
            </svg>
            <div className={styles.logoText}>
              <div className={styles.brandName}>
                Arkuszownia<span className={styles.brandAccent}>SMB</span>
              </div>
              <p className={styles.brandTagline}>{t("brand_tagline")}</p>
            </div>
          </div>

          <div className={styles.headerActions}>
            <div className={styles.langSwitcher}>
              <button
                className={clsx(styles.langBtn, {
                  [styles.active]: lang === "pl"
                })}
                onClick={() => setLang("pl")}
                aria-pressed={lang === "pl"}
              >
                PL
              </button>
              <button
                className={clsx(styles.langBtn, {
                  [styles.active]: lang === "en"
                })}
                onClick={() => setLang("en")}
                aria-pressed={lang === "en"}
              >
                EN
              </button>
            </div>

            <button
              className={styles.themeToggle}
              onClick={toggleTheme}
              aria-label={t(theme === "light" ? "switch_to_dark" : "switch_to_light")}
            >
              {theme === "light" ? "🌙" : "☀️"}
            </button>

            {profile && (
              <>
                <button
                  className={styles.iconBtn}
                  onClick={onSettings}
                  title={t("settings")}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
                    <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
                    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
                  </svg>
                  {profile.hasNotifications && (
                    <span className={styles.notificationDot} />
                  )}
                </button>

                <button
                  className={styles.iconBtn}
                  onClick={onLogout}
                  title={t("logout")}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <nav className={styles.headerNav} role="navigation">
        <div className={styles.headerContent}>
          <div className={styles.menuWrapper}>
            <button
              ref={menuBtnRef}
              className={styles.menuBtn}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-expanded={menuOpen}
              aria-controls="nav-menu"
            >
              <span aria-hidden="true">☰</span>
              <span>{t("menu")}</span>
              {pendingOrders > 0 && (
                <span className={styles.badge} title={t("pending_orders")}>
                  {pendingOrders}
                </span>
              )}
            </button>

            <div
              id="nav-menu"
              ref={menuRef}
              className={clsx(styles.menuDropdown, {
                [styles.open]: menuOpen
              })}
              role="menu"
            >
              <div className={styles.menuList} role="none">
                {navItems.map(({ id, icon, badge }) => (
                  <button
                    key={id}
                    className={clsx(styles.menuItem, {
                      [styles.active]: currentView === id
                    })}
                    onClick={() => {
                      setCurrentView(id);
                      setMenuOpen(false);
                    }}
                    role="menuitem"
                  >
                    {t(id)}
                    {id === "orders" && pendingOrders > 0 && (
                      <span className={styles.badge}>{pendingOrders}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
