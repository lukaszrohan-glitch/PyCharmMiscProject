/**
 * Calendar View Component
 * Displays orders/events on a monthly calendar with deadline highlights
 * Supports drag & drop date changes (optional)
 */
import { useState, useMemo, useCallback } from 'react';
import styles from './CalendarView.module.css';

const DAYS_PL = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'];
const DAYS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS_PL = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
                   'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December'];

function getMonthDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  // Get the day of week for first day (0 = Sunday, we want 0 = Monday)
  let startDayOfWeek = firstDay.getDay() - 1;
  if (startDayOfWeek < 0) startDayOfWeek = 6;

  const days = [];

  // Add empty cells for days before month start
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push(null);
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(year, month, day));
  }

  return days;
}

function isSameDay(d1, d2) {
  if (!d1 || !d2) return false;
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function DayCell({ date, events, isToday, isSelected, lang, onSelect, onEventClick }) {
  if (!date) {
    return <div className={styles.dayEmpty} />;
  }

  const dayEvents = events.filter(e => {
    const eventDate = new Date(e.date);
    return isSameDay(eventDate, date);
  });

  const isOverdue = dayEvents.some(e => e.isOverdue);
  const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));

  return (
    <button
      type="button"
      className={`${styles.day} ${isToday ? styles.today : ''} ${isSelected ? styles.selected : ''} ${isPast ? styles.past : ''} ${isOverdue ? styles.overdue : ''}`}
      onClick={() => onSelect?.(date)}
      aria-label={`${date.getDate()} ${lang === 'pl' ? MONTHS_PL[date.getMonth()] : MONTHS_EN[date.getMonth()]}`}
    >
      <span className={styles.dayNumber}>{date.getDate()}</span>

      {dayEvents.length > 0 && (
        <div className={styles.eventsContainer}>
          {dayEvents.slice(0, 3).map((event, i) => (
            <button
              key={event.id || i}
              type="button"
              className={`${styles.event} ${styles[`status${event.status}`] || ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onEventClick?.(event);
              }}
              title={event.title}
            >
              {event.title}
            </button>
          ))}
          {dayEvents.length > 3 && (
            <span className={styles.moreEvents}>
              +{dayEvents.length - 3} {lang === 'pl' ? 'więcej' : 'more'}
            </span>
          )}
        </div>
      )}
    </button>
  );
}

export default function CalendarView({
  events = [],
  lang = 'pl',
  onDateSelect,
  onEventClick,
  onMonthChange,
  selectedDate,
  initialDate,
}) {
  const [currentDate, setCurrentDate] = useState(() => {
    if (initialDate) return new Date(initialDate);
    return new Date();
  });

  const today = useMemo(() => new Date(), []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthDays = useMemo(() => getMonthDays(year, month), [year, month]);

  const dayNames = lang === 'pl' ? DAYS_PL : DAYS_EN;
  const monthName = lang === 'pl' ? MONTHS_PL[month] : MONTHS_EN[month];

  const goToPrevMonth = useCallback(() => {
    const newDate = new Date(year, month - 1, 1);
    setCurrentDate(newDate);
    onMonthChange?.(newDate);
  }, [year, month, onMonthChange]);

  const goToNextMonth = useCallback(() => {
    const newDate = new Date(year, month + 1, 1);
    setCurrentDate(newDate);
    onMonthChange?.(newDate);
  }, [year, month, onMonthChange]);

  const goToToday = useCallback(() => {
    const todayDate = new Date();
    setCurrentDate(todayDate);
    onMonthChange?.(todayDate);
  }, [onMonthChange]);

  const handleDateSelect = useCallback((date) => {
    onDateSelect?.(formatDate(date));
  }, [onDateSelect]);

  // Process events to add isOverdue flag
  const processedEvents = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return events.map(event => ({
      ...event,
      isOverdue: event.status !== 'Done' && event.status !== 'Invoiced' && new Date(event.date) < now
    }));
  }, [events]);

  // Calculate stats for the month
  const monthStats = useMemo(() => {
    const monthEvents = processedEvents.filter(e => {
      const eventDate = new Date(e.date);
      return eventDate.getMonth() === month && eventDate.getFullYear() === year;
    });

    return {
      total: monthEvents.length,
      overdue: monthEvents.filter(e => e.isOverdue).length,
      upcoming: monthEvents.filter(e => !e.isOverdue && e.status !== 'Done').length,
      done: monthEvents.filter(e => e.status === 'Done' || e.status === 'Invoiced').length,
    };
  }, [processedEvents, month, year]);

  const t = {
    today: lang === 'pl' ? 'Dziś' : 'Today',
    total: lang === 'pl' ? 'Wszystkie' : 'Total',
    overdue: lang === 'pl' ? 'Spóźnione' : 'Overdue',
    upcoming: lang === 'pl' ? 'Nadchodzące' : 'Upcoming',
    done: lang === 'pl' ? 'Zakończone' : 'Done',
  };

  return (
    <div className={styles.calendar}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.navigation}>
          <button
            type="button"
            className={styles.navBtn}
            onClick={goToPrevMonth}
            aria-label={lang === 'pl' ? 'Poprzedni miesiąc' : 'Previous month'}
          >
            ◀
          </button>
          <h3 className={styles.monthTitle}>
            {monthName} {year}
          </h3>
          <button
            type="button"
            className={styles.navBtn}
            onClick={goToNextMonth}
            aria-label={lang === 'pl' ? 'Następny miesiąc' : 'Next month'}
          >
            ▶
          </button>
        </div>

        <button
          type="button"
          className={styles.todayBtn}
          onClick={goToToday}
        >
          {t.today}
        </button>
      </div>

      {/* Stats bar */}
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{monthStats.total}</span>
          <span className={styles.statLabel}>{t.total}</span>
        </div>
        {monthStats.overdue > 0 && (
          <div className={`${styles.stat} ${styles.statOverdue}`}>
            <span className={styles.statValue}>{monthStats.overdue}</span>
            <span className={styles.statLabel}>{t.overdue}</span>
          </div>
        )}
        <div className={styles.stat}>
          <span className={styles.statValue}>{monthStats.upcoming}</span>
          <span className={styles.statLabel}>{t.upcoming}</span>
        </div>
        <div className={`${styles.stat} ${styles.statDone}`}>
          <span className={styles.statValue}>{monthStats.done}</span>
          <span className={styles.statLabel}>{t.done}</span>
        </div>
      </div>

      {/* Day names header */}
      <div className={styles.dayNames}>
        {dayNames.map(day => (
          <div key={day} className={styles.dayName}>{day}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className={styles.grid}>
        {monthDays.map((date, index) => (
          <DayCell
            key={index}
            date={date}
            events={processedEvents}
            isToday={date && isSameDay(date, today)}
            isSelected={date && selectedDate && isSameDay(date, new Date(selectedDate))}
            lang={lang}
            onSelect={handleDateSelect}
            onEventClick={onEventClick}
          />
        ))}
      </div>
    </div>
  );
}

