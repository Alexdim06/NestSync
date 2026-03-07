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

function yearMonthStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function isDateKeyFuture(dateKey) {
  const today = new Date();
  const todayKey = toDateKey(today);
  return dateKey > todayKey;
}

function SalaryEditIcon({ className }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 21 19" xmlns="http://www.w3.org/2000/svg" style={{ fillRule: 'evenodd', clipRule: 'evenodd', strokeLinejoin: 'round', strokeMiterlimit: 2 }}>
      <g transform="matrix(1,0,0,1,-962.164978,-1072.611462)">
        <path d="M982.498,1090.99L962.448,1090.99C962.291,1090.99 962.165,1090.87 962.165,1090.71C962.165,1090.55 962.291,1090.43 962.448,1090.43L982.498,1090.43C982.655,1090.43 982.781,1090.55 982.781,1090.71C982.781,1090.87 982.655,1090.99 982.498,1090.99Z" style={{ fill: 'currentColor', fillRule: 'nonzero' }} />
        <path d="M970.756,1087.36L970.758,1087.36L970.756,1087.36ZM967.773,1085.31L967.948,1088.11L970.568,1087.13L978.364,1075.1L975.569,1073.29L967.773,1085.31ZM967.688,1088.8L967.535,1088.75L967.406,1088.53L967.202,1085.26L967.247,1085.08L975.248,1072.74C975.333,1072.61 975.508,1072.57 975.64,1072.66L978.91,1074.78L979.033,1074.96L978.993,1075.17L970.993,1087.51L970.855,1087.62L967.789,1088.78L967.688,1088.8Z" style={{ fill: 'currentColor', fillRule: 'nonzero' }} />
      </g>
    </svg>
  );
}

function Calendar() {
  const { user } = useAuth();
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth());
  const [monthlySalary, setMonthlySalary] = useState(0);
  const [salaryPayDay, setSalaryPayDay] = useState(null);
  const [salaryEditing, setSalaryEditing] = useState(true);
  const [salaryInput, setSalaryInput] = useState('');
  const [payDayInput, setPayDayInput] = useState('');
  const [cardBalance, setCardBalance] = useState(0);
  const [lastSalaryAdd, setLastSalaryAdd] = useState(null);
  const [entries, setEntries] = useState({});
  const [selectedDay, setSelectedDay] = useState(null);
  const [newNameAdd, setNewNameAdd] = useState('');
  const [newAmountAdd, setNewAmountAdd] = useState('');
  const [newNameRemove, setNewNameRemove] = useState('');
  const [newAmountRemove, setNewAmountRemove] = useState('');
  const [modalTab, setModalTab] = useState('entries');
  const [savedItems, setSavedItems] = useState([]);
  const [newSavedName, setNewSavedName] = useState('');
  const [newSavedAmount, setNewSavedAmount] = useState('');
  const [newSavedType, setNewSavedType] = useState('remove');

  const key = STORAGE_KEY(user?.id);
  const todayKey = toDateKey(new Date());
  const initialBalance = user?.initialCardAmount ?? 0;

  const saveData = useCallback(
    (payload) => {
      try {
        localStorage.setItem(key, JSON.stringify(payload));
      } catch (e) {
        console.warn('Calendar save failed', e);
      }
    },
    [key]
  );

  const loadData = useCallback(() => {
    try {
      const raw = localStorage.getItem(key);
      const now = new Date();
      const currentYM = yearMonthStr(now);
      const todayK = toDateKey(now);
      if (raw) {
        const data = JSON.parse(raw);
        setMonthlySalary(data.monthlySalary ?? 0);
        setSalaryPayDay(data.salaryPayDay ?? null);
        setEntries(data.entries ?? {});
        setSavedItems(data.savedItems ?? []);
        let last = data.lastSalaryAdd ?? null;
        const payDay = data.salaryPayDay ?? null;
        const salary = data.monthlySalary ?? 0;
        let balance = initialBalance;
        if (payDay != null && salary > 0 && last !== currentYM && now.getDate() >= payDay) {
          balance += salary;
          last = currentYM;
        }
        const allEntries = data.entries ?? {};
        Object.keys(allEntries).forEach((dk) => {
          if (dk > todayK) return;
          (allEntries[dk] || []).forEach((e) => {
            const t = e.type || 'add';
            if (t === 'remove') balance -= e.amount;
            else balance += e.amount;
          });
        });
        setCardBalance(balance);
        setLastSalaryAdd(last);
        if (last !== (data.lastSalaryAdd ?? null)) {
          try {
            localStorage.setItem(key, JSON.stringify({
              ...data,
              cardBalance: balance,
              lastSalaryAdd: last,
              savedItems: data.savedItems ?? [],
            }));
          } catch (e) {
            console.warn('Calendar save failed', e);
          }
        }
        setSalaryEditing(false);
        setSalaryInput('');
        setPayDayInput('');
      } else {
        setMonthlySalary(0);
        setSalaryPayDay(null);
        setEntries({});
        setSavedItems([]);
        setCardBalance(initialBalance);
        setLastSalaryAdd(null);
        setSalaryEditing(true);
      }
    } catch {
      setMonthlySalary(0);
      setSalaryPayDay(null);
      setEntries({});
      setSavedItems([]);
      setCardBalance(initialBalance);
      setSalaryEditing(true);
    }
  }, [key, initialBalance]);

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

  const handleSalarySave = () => {
    const num = Number(salaryInput) || 0;
    const day = payDayInput === '' || payDayInput === 'no' ? null : Math.min(31, Math.max(1, parseInt(payDayInput, 10) || null));
    setMonthlySalary(num);
    setSalaryPayDay(day);
    setSalaryEditing(false);
    setSalaryInput('');
    setPayDayInput('');
    saveData({
      monthlySalary: num,
      salaryPayDay: day,
      cardBalance,
      lastSalaryAdd,
      entries,
      savedItems,
    });
  };

  const startSalaryEdit = () => {
    setSalaryEditing(true);
    setSalaryInput(monthlySalary > 0 ? String(monthlySalary) : '');
    setPayDayInput(salaryPayDay != null ? String(salaryPayDay) : '');
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
    const amt = Number(amount) || 0;
    const list = entries[dateKey] ?? [];
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: (name || '').trim(),
      amount: amt,
      type: type || 'add',
    };
    const next = { ...entries, [dateKey]: [...list, entry] };
    const isFuture = isDateKeyFuture(dateKey);
    const newBalance = isFuture ? cardBalance : (type === 'remove' ? cardBalance - amt : cardBalance + amt);
    setEntries(next);
    setCardBalance(newBalance);
    saveData({
      monthlySalary,
      salaryPayDay,
      cardBalance: newBalance,
      lastSalaryAdd,
      entries: next,
      savedItems,
    });
    if (type === 'add') {
      setNewNameAdd('');
      setNewAmountAdd('');
    } else {
      setNewNameRemove('');
      setNewAmountRemove('');
    }
  };

  const removeEntry = (dateKey, entryId) => {
    const list = entries[dateKey] ?? [];
    const entry = list.find((e) => e.id === entryId);
    if (!entry) return;
    const nextList = list.filter((e) => e.id !== entryId);
    const next = { ...entries, [dateKey]: nextList };
    if (nextList.length === 0) delete next[dateKey];
    const isFuture = isDateKeyFuture(dateKey);
    const delta = isFuture ? 0 : (entry.type === 'remove' ? entry.amount : -entry.amount);
    const newBalance = cardBalance + delta;
    setEntries(next);
    setCardBalance(newBalance);
    saveData({
      monthlySalary,
      salaryPayDay,
      cardBalance: newBalance,
      lastSalaryAdd,
      entries: next,
      savedItems,
    });
  };

  const openDay = (day) => {
    setSelectedDay(day);
    setModalTab('entries');
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

  const isSelectedDayFuture = selectedDateKey ? isDateKeyFuture(selectedDateKey) : false;

  const addSavedToDay = (item) => {
    if (!selectedDateKey) return;
    addEntry(selectedDateKey, item.name, item.amount, item.type);
  };

  const saveNewSavedItem = (e) => {
    e.preventDefault();
    const name = (newSavedName || '').trim();
    const amount = Number(newSavedAmount) || 0;
    if (!name) return;
    const item = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name,
      amount,
      type: newSavedType,
    };
    const next = [...savedItems, item];
    setSavedItems(next);
    setNewSavedName('');
    setNewSavedAmount('');
    saveData({
      monthlySalary,
      salaryPayDay,
      cardBalance,
      lastSalaryAdd,
      entries,
      savedItems: next,
    });
  };

  const removeSavedItem = (itemId) => {
    const next = savedItems.filter((i) => i.id !== itemId);
    setSavedItems(next);
    saveData({
      monthlySalary,
      salaryPayDay,
      cardBalance,
      lastSalaryAdd,
      entries,
      savedItems: next,
    });
  };

  const handleAddInModal = (e, type) => {
    e.preventDefault();
    if (!selectedDateKey) return;
    if (type === 'add') addEntry(selectedDateKey, newNameAdd, newAmountAdd, 'add');
    else addEntry(selectedDateKey, newNameRemove, newAmountRemove, 'remove');
  };

  const totalSpentThisMonth = () => {
    let sum = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const dk = toDateKey(new Date(year, month, day));
      if (dk > todayKey) continue;
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

  const cardBarPercent = monthlySalary > 0 ? Math.min(100, (cardBalance / monthlySalary) * 100) : (cardBalance > 0 ? 100 : 0);

  return (
    <div className="calendar-page">
      <h1 className="calendar-page__title">Calendar</h1>

      <div className="calendar-top-row">
        <div className="calendar-salary">
          {salaryEditing ? (
            <div className="calendar-salary__edit">
              <label className="calendar-salary__label">
                <span>Monthly salary</span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={salaryInput}
                  onChange={(e) => setSalaryInput(e.target.value)}
                  placeholder="e.g. 3000"
                />
              </label>
              <label className="calendar-salary__label">
                <span>Pay day (1–31, or leave empty for no salary)</span>
                <input
                  type="text"
                  value={payDayInput}
                  onChange={(e) => setPayDayInput(e.target.value)}
                  placeholder="e.g. 25 or empty"
                />
              </label>
              <button
                type="button"
                className="calendar-salary__svg-btn"
                onClick={handleSalarySave}
                title="Save"
              >
                <SalaryEditIcon />
              </button>
            </div>
          ) : (
            <div className="calendar-salary__display">
              <div className="calendar-salary__values">
                <span className="calendar-salary__main">
                  Monthly salary: ${monthlySalary.toLocaleString()}
                </span>
                <span className="calendar-salary__sub">
                  {salaryPayDay != null ? `Pay day: ${salaryPayDay}` : 'No salary'}
                </span>
              </div>
              <button
                type="button"
                className="calendar-salary__svg-btn"
                onClick={startSalaryEdit}
                title="Edit"
              >
                <SalaryEditIcon />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="calendar-progress-wrap">
        <div className="calendar-progress">
          <div
            className="calendar-progress__value calendar-progress__value--spent"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="calendar-progress__label">
          Spent: ${spentThisMonth.toFixed(0)} / ${monthlySalary.toFixed(0)} ({progressPercent.toFixed(0)}%)
        </p>
      </div>

      <div className="calendar-progress-wrap">
        <div className="calendar-progress">
          <div
            className="calendar-progress__value calendar-progress__value--card"
            style={{ width: `${cardBarPercent}%` }}
          />
        </div>
        <p className="calendar-progress__label">
          Card balance: ${cardBalance.toFixed(2)}
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
            const dayKey = toDateKey(new Date(year, month, day));
            const future = dayKey > todayKey;
            return (
              <button
                key={day}
                type="button"
                className={`calendar-day ${isToday(day) ? 'calendar-day--today' : ''} ${future ? 'calendar-day--future' : ''}`}
                onClick={() => openDay(day)}
              >
                <span className="calendar-day__num">{day}</span>
                {dayEntries.length > 0 && (
                  <span className={`calendar-day__badge ${total >= 0 ? 'calendar-day__badge--add' : 'calendar-day__badge--remove'} ${future ? 'calendar-day__badge--scheduled' : ''}`}>
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

            {isSelectedDayFuture && (
              <div className="calendar-modal__future-banner">
                Not paid yet / Not received yet. Amounts will apply to card balance when this date is reached.
              </div>
            )}

            <div className="calendar-modal__tabs">
              <button
                type="button"
                className={`calendar-modal__tab ${modalTab === 'entries' ? 'calendar-modal__tab--active' : ''}`}
                onClick={() => setModalTab('entries')}
              >
                Entries
              </button>
              <button
                type="button"
                className={`calendar-modal__tab ${modalTab === 'saved' ? 'calendar-modal__tab--active' : ''}`}
                onClick={() => setModalTab('saved')}
              >
                Saved
              </button>
            </div>

            {modalTab === 'entries' && (
              <>
                <div className={`calendar-modal__total ${selectedTotal >= 0 ? 'calendar-modal__total--add' : 'calendar-modal__total--remove'} ${isSelectedDayFuture ? 'calendar-modal__total--scheduled' : ''}`}>
                  Day total: ${selectedTotal >= 0 ? '' : '-'}${Math.abs(selectedTotal).toFixed(2)}
                  {!isSelectedDayFuture && (
                    <span className="calendar-modal__balance-hint">Card balance updates when you add/remove.</span>
                  )}
                </div>
                <ul className="calendar-modal__list">
                  {selectedEntries.map((entry) => (
                    <li key={entry.id} className={`calendar-modal__item calendar-modal__item--${entry.type} ${isSelectedDayFuture ? 'calendar-modal__item--scheduled' : ''}`}>
                      <span className="calendar-modal__item-text">
                        {entry.name}: {entry.type === 'remove' ? '-' : '+'}${entry.amount}
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
                <div className="calendar-modal__section">
                  <h3 className="calendar-modal__section-title calendar-modal__section-title--add">Add to card</h3>
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
                </div>
                <div className="calendar-modal__section">
                  <h3 className="calendar-modal__section-title calendar-modal__section-title--remove">Remove from card</h3>
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
              </>
            )}

            {modalTab === 'saved' && (
              <div className="calendar-modal__saved">
                <p className="calendar-modal__saved-intro">Add from saved items to this day (e.g. gym $100/month).</p>
                <ul className="calendar-modal__saved-list">
                  {savedItems.map((item) => (
                    <li key={item.id} className={`calendar-modal__saved-item calendar-modal__saved-item--${item.type}`}>
                      <span className="calendar-modal__saved-item-text">{item.name}: ${item.amount}</span>
                      <div className="calendar-modal__saved-item-actions">
                        <button type="button" className="calendar-modal__btn calendar-modal__btn--add calendar-modal__btn--small" onClick={() => addSavedToDay(item)}>
                          Add to this day
                        </button>
                        <button type="button" className="calendar-modal__item-delete" onClick={() => removeSavedItem(item.id)}>Remove</button>
                      </div>
                    </li>
                  ))}
                </ul>
                <form className="calendar-modal__saved-form" onSubmit={saveNewSavedItem}>
                  <h3 className="calendar-modal__section-title">New saved item</h3>
                  <input
                    type="text"
                    placeholder="Name (e.g. Gym)"
                    value={newSavedName}
                    onChange={(e) => setNewSavedName(e.target.value)}
                    className="calendar-modal__input"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Amount ($)"
                    value={newSavedAmount}
                    onChange={(e) => setNewSavedAmount(e.target.value)}
                    className="calendar-modal__input"
                  />
                  <label className="calendar-modal__saved-type">
                    <span>Type:</span>
                    <select value={newSavedType} onChange={(e) => setNewSavedType(e.target.value)}>
                      <option value="add">Add to card</option>
                      <option value="remove">Remove from card</option>
                    </select>
                  </label>
                  <button type="submit" className="calendar-modal__btn calendar-modal__btn--add">Save item</button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Calendar;
