import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import './Calendar.css';

const STORAGE_KEY = (userId) => `nestsync_calendar_${userId ?? 'guest'}`;

function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function Calendar() {
  const { user } = useAuth();
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth());
  const [monthlySalary, setMonthlySalary] = useState(0);
  const [entries, setEntries] = useState({});
  const [selectedDay, setSelectedDay] = useState(null);
  const [newNameAdd, setNewNameAdd] = useState('');
  const [newAmountAdd, setNewAmountAdd] = useState('');
  const [newNameRemove, setNewNameRemove] = useState('');
  const [newAmountRemove, setNewAmountRemove] = useState('');

  const key = STORAGE_KEY(user?.id);

  const loadData = useCallback(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const data = JSON.parse(raw);
        setMonthlySalary(data.monthlySalary ?? 0);
        setEntries(data.entries ?? {});
      }
    } catch {
      setMonthlySalary(0);
      setEntries({});
    }
  }, [key]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (selectedDay == null) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setSelectedDay(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedDay]);

  const saveData = useCallback(
    (salary, entriesMap) => {
      const data = { monthlySalary: salary, entries: entriesMap };
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch (e) {
        console.warn('Calendar save failed', e);
      }
    },
    [key]
  );

  const setMonthlySalaryAndSave = (v) => {
    const num = Number(v) || 0;
    setMonthlySalary(num);
    saveData(num, entries);
  };

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyStart = Array(firstDay).fill(null);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getEntriesForDay = (day) => {
    const date = new Date(year, month, day);
    const list = entries[toDateKey(date)] ?? [];
    return list.map((e) => ({ ...e, type: e.type || 'add' }));
  };

  const addEntry = (dateKey, name, amount, type) => {
    const list = entries[dateKey] ?? [];
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: (name || '').trim(),
      amount: Number(amount) || 0,
      type: type || 'add',
    };
    const next = { ...entries, [dateKey]: [...list, entry] };
    setEntries(next);
    saveData(monthlySalary, next);
    if (type === 'add') {
      setNewNameAdd('');
      setNewAmountAdd('');
    } else {
      setNewNameRemove('');
      setNewAmountRemove('');
    }
  };

  const removeEntry = (dateKey, entryId) => {
    const list = (entries[dateKey] ?? []).filter((e) => e.id !== entryId);
    const next = { ...entries, [dateKey]: list };
    if (list.length === 0) {
      delete next[dateKey];
    }
    setEntries(next);
    saveData(monthlySalary, next);
  };

  const openDay = (day) => {
    setSelectedDay(day);
    setNewNameAdd('');
    setNewAmountAdd('');
    setNewNameRemove('');
    setNewAmountRemove('');
  };

  const selectedDateKey = selectedDay != null ? toDateKey(new Date(year, month, selectedDay)) : null;
  const selectedEntriesRaw = selectedDateKey ? (entries[selectedDateKey] ?? []) : [];
  const selectedEntries = selectedEntriesRaw.map((e) => ({ ...e, type: e.type || 'add' }));
  const selectedTotal = selectedEntries.reduce(
    (s, e) => s + (e.type === 'remove' ? -e.amount : e.amount),
    0
  );

  const handleAddInModal = (e, type) => {
    e.preventDefault();
    if (!selectedDateKey) return;
    if (type === 'add') addEntry(selectedDateKey, newNameAdd, newAmountAdd, 'add');
    else addEntry(selectedDateKey, newNameRemove, newAmountRemove, 'remove');
  };

  const totalSpentThisMonth = () => {
    let sum = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const list = getEntriesForDay(day);
      list.forEach((e) => {
        if (e.type === 'remove') sum += e.amount;
      });
    }
    return sum;
  };
  const spentThisMonth = totalSpentThisMonth();
  const progressPercent = monthlySalary > 0 ? Math.min(100, (spentThisMonth / monthlySalary) * 100) : 0;

  const monthName = new Date(year, month, 1).toLocaleString('en-US', { month: 'long' });
  const today = new Date();
  const isToday = (day) =>
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  return (
    <div className="calendar-page">
      <h1 className="calendar-page__title">Calendar</h1>

      <div className="calendar-salary">
        <label className="calendar-salary__label">
          <span>Monthly salary</span>
          <input
            type="number"
            min="0"
            step="100"
            value={monthlySalary || ''}
            onChange={(e) => setMonthlySalaryAndSave(e.target.value)}
            placeholder="e.g. 3000"
          />
        </label>
      </div>

      <div className="calendar-progress-wrap">
        <div className="calendar-progress">
          <div
            className="calendar-progress__value"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="calendar-progress__label">
          Spent: ${spentThisMonth.toFixed(0)} / ${monthlySalary.toFixed(0)} ({progressPercent.toFixed(0)}%)
        </p>
      </div>

      <div className="calendar-nav">
        <button
          type="button"
          className="calendar-nav__btn"
          onClick={() => {
            if (month === 0) {
              setMonth(11);
              setYear((y) => y - 1);
            } else {
              setMonth((m) => m - 1);
            }
          }}
        >
          ←
        </button>
        <span className="calendar-nav__month">
          {monthName} {year}
        </span>
        <button
          type="button"
          className="calendar-nav__btn"
          onClick={() => {
            if (month === 11) {
              setMonth(0);
              setYear((y) => y + 1);
            } else {
              setMonth((m) => m + 1);
            }
          }}
        >
          →
        </button>
      </div>

      <div className="calendar-grid-wrap">
        <div className="calendar-weekdays">
          {weekDays.map((d) => (
            <span key={d} className="calendar-weekdays__cell">{d}</span>
          ))}
        </div>
        <div className="calendar-grid">
          {emptyStart.map((_, i) => (
            <span key={`e-${i}`} className="calendar-day calendar-day--empty" />
          ))}
          {days.map((day) => {
            const dayEntries = getEntriesForDay(day);
            const total = dayEntries.reduce(
              (s, e) => s + (e.type === 'remove' ? -e.amount : e.amount),
              0
            );
            return (
              <button
                key={day}
                type="button"
                className={`calendar-day ${isToday(day) ? 'calendar-day--today' : ''}`}
                onClick={() => openDay(day)}
              >
                <span className="calendar-day__num">{day}</span>
                {dayEntries.length > 0 && (
                  <span className={`calendar-day__badge ${total >= 0 ? 'calendar-day__badge--add' : 'calendar-day__badge--remove'}`}>
                    {dayEntries.length} · ${Math.abs(total).toFixed(0)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedDay != null && (
        <div
          className="calendar-modal-overlay"
          onClick={() => setSelectedDay(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Day details"
        >
          <div
            className="calendar-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="calendar-modal__head">
              <h2 className="calendar-modal__title">
                {monthName} {selectedDay}, {year}
              </h2>
              <button
                type="button"
                className="calendar-modal__close"
                onClick={() => setSelectedDay(null)}
              >
                ×
              </button>
            </div>
            <div className={`calendar-modal__total ${selectedTotal >= 0 ? 'calendar-modal__total--add' : 'calendar-modal__total--remove'}`}>
              Total: ${selectedTotal >= 0 ? '' : '-'}${Math.abs(selectedTotal).toFixed(2)}
            </div>
            <ul className="calendar-modal__list">
              {selectedEntries.map((entry) => (
                <li key={entry.id} className={`calendar-modal__item calendar-modal__item--${entry.type}`}>
                  <span className="calendar-modal__item-text">
                    {entry.name}: {entry.type === 'remove' ? '-' : ''}${entry.amount}
                  </span>
                  <button
                    type="button"
                    className="calendar-modal__item-delete"
                    onClick={() => removeEntry(selectedDateKey, entry.id)}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
            <form className="calendar-modal__form" onSubmit={(e) => handleAddInModal(e, 'add')}>
              <input
                type="text"
                placeholder="Name (e.g. Bonus)"
                value={newNameAdd}
                onChange={(e) => setNewNameAdd(e.target.value)}
                className="calendar-modal__input"
              />
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Amount ($)"
                value={newAmountAdd}
                onChange={(e) => setNewAmountAdd(e.target.value)}
                className="calendar-modal__input"
              />
              <button type="submit" className="calendar-modal__btn calendar-modal__btn--add">
                Add value
              </button>
            </form>
            <form className="calendar-modal__form" onSubmit={(e) => handleAddInModal(e, 'remove')}>
              <input
                type="text"
                placeholder="Name (e.g. Netflix)"
                value={newNameRemove}
                onChange={(e) => setNewNameRemove(e.target.value)}
                className="calendar-modal__input"
              />
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Amount ($)"
                value={newAmountRemove}
                onChange={(e) => setNewAmountRemove(e.target.value)}
                className="calendar-modal__input"
              />
              <button type="submit" className="calendar-modal__btn calendar-modal__btn--remove">
                Remove value
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Calendar;
