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

const DEFAULT_CATEGORY_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'];

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
  const [salaryEditing, setSalaryEditing] = useState(true);
  const [salaryInput, setSalaryInput] = useState('');
  const [salaryPayDay, setSalaryPayDay] = useState(null);
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
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState(DEFAULT_CATEGORY_COLORS[0]);
  const [newCategoryPercent, setNewCategoryPercent] = useState('');
  const [newSavedCategoryId, setNewSavedCategoryId] = useState('');
  const [showNewCategoryPopup, setShowNewCategoryPopup] = useState(false);

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
        setCategories(data.categories ?? []);
        let last = data.lastSalaryAdd ?? null;
        let balance = initialBalance;
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
        setSalaryEditing(false);
        setSalaryInput('');
      } else {
        setMonthlySalary(0);
        setSalaryPayDay(null);
        setEntries({});
        setSavedItems([]);
        setCategories([]);
        setCardBalance(initialBalance);
        setLastSalaryAdd(null);
        setSalaryEditing(true);
      }
    } catch {
      setMonthlySalary(0);
      setSalaryPayDay(null);
      setEntries({});
      setSavedItems([]);
      setCategories([]);
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
    setMonthlySalary(num);
    setSalaryEditing(false);
    setSalaryInput('');
    saveData({
      monthlySalary: num,
      salaryPayDay,
      cardBalance,
      lastSalaryAdd,
      entries,
      savedItems,
      categories,
    });
  };

  const handleAddSalaryNow = () => {
    if (!monthlySalary || monthlySalary <= 0) return;
    const now = new Date();
    const dateKey = toDateKey(now);
    const currentYM = yearMonthStr(now);
    if (lastSalaryAdd === currentYM) return;
    addEntry(dateKey, 'Salary', monthlySalary, 'add');
    const nextLast = currentYM;
    setLastSalaryAdd(nextLast);
    saveData({
      monthlySalary,
      salaryPayDay,
      cardBalance,
      lastSalaryAdd: nextLast,
      entries,
      savedItems,
      categories,
    });
  };

  const startSalaryEdit = () => {
    setSalaryEditing(true);
    setSalaryInput(monthlySalary > 0 ? String(monthlySalary) : '');
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

  const getCategoryById = (id) => (id ? categories.find((c) => c.id === id) : null);

  const addEntry = (dateKey, name, amount, type, categoryId = null) => {
    const amt = Number(amount) || 0;
    const list = entries[dateKey] ?? [];
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: (name || '').trim(),
      amount: amt,
      type: type || 'add',
      categoryId: categoryId || undefined,
      createdAt: Date.now(),
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
      categories,
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
      categories,
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
    addEntry(selectedDateKey, item.name, item.amount, item.type, item.categoryId ?? null);
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
      categoryId: newSavedCategoryId || undefined,
    };
    const next = [...savedItems, item];
    setSavedItems(next);
    setNewSavedName('');
    setNewSavedAmount('');
    setNewSavedCategoryId('');
    saveData({
      monthlySalary,
      salaryPayDay,
      cardBalance,
      lastSalaryAdd,
      entries,
      savedItems: next,
      categories,
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
      categories,
    });
  };

  const addCategory = (e) => {
    e.preventDefault();
    const name = (newCategoryName || '').trim();
    if (!name) return false;
    const cat = {
      id: `cat-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name,
      color: newCategoryColor,
    };
    const next = [...categories, cat];
    setCategories(next);
    setNewCategoryName('');
    setNewCategoryPercent('');
    setNewCategoryColor(DEFAULT_CATEGORY_COLORS[next.length % DEFAULT_CATEGORY_COLORS.length]);
    saveData({
      monthlySalary,
      salaryPayDay,
      cardBalance,
      lastSalaryAdd,
      entries,
      savedItems,
      categories: next,
    });
    return true;
  };

  const removeCategory = (catId) => {
    const next = categories.filter((c) => c.id !== catId);
    setCategories(next);
    saveData({
      monthlySalary,
      salaryPayDay,
      cardBalance,
      lastSalaryAdd,
      entries,
      savedItems,
      categories: next,
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

  const spentByCategorySegments = (() => {
    const buckets = { '': { amount: 0, name: 'Некатегоризирани', color: 'var(--red)' } };
    categories.forEach((c) => { buckets[c.id] = { amount: 0, name: c.name, color: c.color }; });
    for (let day = 1; day <= daysInMonth; day++) {
      const dk = toDateKey(new Date(year, month, day));
      if (dk > todayKey) continue;
      const list = entries[dk] ?? [];
      list.forEach((e) => {
        if (e.type !== 'remove') return;
        const id = (e.categoryId && getCategoryById(e.categoryId)) ? e.categoryId : '';
        if (!buckets[id]) buckets[id] = { amount: 0, name: 'Некатегоризирани', color: 'var(--red)' };
        buckets[id].amount += e.amount;
      });
    }
    return Object.entries(buckets)
      .filter(([, v]) => v.amount > 0)
      .map(([categoryId, v]) => ({
        categoryId: categoryId || null,
        ...v,
        percentOfSpent: spentThisMonth > 0 ? (v.amount / spentThisMonth) * 100 : 0,
      }));
  })();

  const progressPercent = monthlySalary > 0 ? Math.min(100, (spentThisMonth / monthlySalary) * 100) : 0;

  const monthName = new Date(year, month, 1).toLocaleString('en-US', { month: 'long' });
  const today = new Date();
  const isToday = (day) =>
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  const cardBarPercent = monthlySalary > 0 ? Math.min(100, (cardBalance / monthlySalary) * 100) : (cardBalance > 0 ? 100 : 0);

  const [chartRange, setChartRange] = useState('1m');
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const getBalanceAtEndOfDay = useCallback(
    (dateKey) => {
      let balance = initialBalance;
      const sortedKeys = Object.keys(entries).sort();
      sortedKeys.forEach((dk) => {
        if (dk > dateKey) return;
        const dayEntries = (entries[dk] || []).slice().sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
        dayEntries.forEach((e) => {
          const t = e.type || 'add';
          if (t === 'remove') balance -= e.amount;
          else balance += e.amount;
        });
      });
      return balance;
    },
    [entries, initialBalance]
  );

  const getBalanceAtStartOfDay = useCallback(
    (dateKey) => {
      const d = new Date(dateKey);
      d.setDate(d.getDate() - 1);
      const prevKey = toDateKey(d);
      return getBalanceAtEndOfDay(prevKey);
    },
    [getBalanceAtEndOfDay]
  );

  const buildBalanceTimeline = useCallback(
    (daysBack) => {
      const timeline = [];
      const base = new Date();
      for (let i = daysBack; i >= 0; i--) {
        const d = new Date(base);
        d.setDate(d.getDate() - i);
        const dateKey = toDateKey(d);
        timeline.push({ date: d, balance: getBalanceAtEndOfDay(dateKey) });
      }
      return timeline;
    },
    [getBalanceAtEndOfDay]
  );

  const buildBalanceTimelineFromEvents = useCallback(
    (daysBack) => {
      const points = [];
      const base = new Date();
      for (let i = daysBack; i >= 0; i--) {
        const d = new Date(base);
        d.setDate(d.getDate() - i);
        const dateKey = toDateKey(d);
        let balance = getBalanceAtStartOfDay(dateKey);
        const startOfDay = new Date(d);
        startOfDay.setHours(0, 0, 0, 0);
        points.push({ date: startOfDay, balance });
        const dayEntries = (entries[dateKey] || []).slice().sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
        for (const e of dayEntries) {
          const entryTime = e.createdAt != null ? new Date(e.createdAt) : new Date(d);
          const pointDate = new Date(d);
          pointDate.setHours(entryTime.getHours(), entryTime.getMinutes(), entryTime.getSeconds(), 0);
          balance += (e.type === 'remove' ? -e.amount : e.amount);
          points.push({ date: pointDate, balance });
        }
      }
      points.push({ date: new Date(), balance: cardBalance });
      points.sort((a, b) => a.date.getTime() - b.date.getTime());
      points[points.length - 1] = { date: new Date(), balance: cardBalance };
      return points;
    },
    [getBalanceAtStartOfDay, entries, cardBalance]
  );

  const buildBalanceTimelineHours = useCallback(
    (totalHours, stepHours) => {
      const timeline = [];
      const base = new Date();
      base.setMinutes(0, 0, 0);
      const start = new Date(base.getTime() - totalHours * 60 * 60 * 1000);
      const steps = Math.floor((totalHours * 60 * 60) / (stepHours * 60 * 60));
      for (let i = 0; i <= steps; i++) {
        const t = new Date(start.getTime() + i * stepHours * 60 * 60 * 1000);
        const isLast = i === steps;
        const balance = isLast
          ? cardBalance
          : getBalanceAtEndOfDay(toDateKey(new Date(t.getTime() - 24 * 60 * 60 * 1000)));
        timeline.push({ date: isLast ? new Date() : t, balance });
      }
      return timeline;
    },
    [getBalanceAtEndOfDay, cardBalance]
  );

  const getTimelineForRange = () => {
    switch (chartRange) {
      case '1w':
        return buildBalanceTimelineFromEvents(7);
      case '6m':
        return buildBalanceTimelineFromEvents(180);
      case '1y':
        return buildBalanceTimelineFromEvents(365);
      case '1m':
      default:
        return buildBalanceTimelineFromEvents(30);
    }
  };

  const balanceTimeline = getTimelineForRange();

  const rawMaxBalance = balanceTimeline.length
    ? Math.max(...balanceTimeline.map((p) => p.balance))
    : 0;
  const minBalance = balanceTimeline.length
    ? Math.min(...balanceTimeline.map((p) => p.balance))
    : 0;

  const maxBalance =
    rawMaxBalance === minBalance
      ? rawMaxBalance || 0
      : rawMaxBalance + Math.abs(rawMaxBalance - minBalance) * 0.3;

  const normalizedPoints = balanceTimeline.map((p, idx) => {
    const x = (idx / Math.max(1, balanceTimeline.length - 1)) * 100;
    const range = maxBalance - minBalance || 1;
    const rawY = 100 - ((p.balance - minBalance) / range) * 100;
    const y = 10 + (rawY / 100) * 80; // clamp between 10% and 90%
    return { x, y, date: p.date, balance: p.balance };
  });

  const buildSmoothPath = (points, height) => {
    if (!points.length) return '';
    if (points.length === 1) {
      const py = (points[0].y / 100) * height;
      return `M ${points[0].x} ${py}`;
    }
    const toY = (p) => (p.y / 100) * height;
    let d = `M ${points[0].x} ${toY(points[0])}`;
    for (let i = 1; i < points.length; i++) {
      const p0 = points[i - 1];
      const p1 = points[i];
      const pPrev = points[i - 2] || p0;
      const pNext = points[i + 1] || p1;
      const smoothing = 0.2;
      const cp1x = p0.x + (p1.x - pPrev.x) * smoothing;
      const cp1y = toY(p0) + (toY(p1) - toY(pPrev)) * smoothing;
      const cp2x = p1.x - (pNext.x - p0.x) * smoothing;
      const cp2y = toY(p1) - (toY(pNext) - toY(p0)) * smoothing;
      d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p1.x} ${toY(p1)}`;
    }
    return d;
  };

  const linePathD = buildSmoothPath(normalizedPoints, 36);
  const areaPathD = linePathD && normalizedPoints.length > 0
    ? `${linePathD} L ${normalizedPoints[normalizedPoints.length - 1].x} 36 L ${normalizedPoints[0].x} 36 Z`
    : '';

  const chartAxisLabels = [];

  const activePoint =
    normalizedPoints.length === 0
      ? null
      : hoveredIndex != null && normalizedPoints[hoveredIndex]
        ? normalizedPoints[hoveredIndex]
        : normalizedPoints[normalizedPoints.length - 1];

  const handleChartMove = (event) => {
    if (!normalizedPoints.length) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const relative = ((event.clientX - rect.left) / rect.width) * 100;
    let nearestIndex = 0;
    let nearestDist = Infinity;
    normalizedPoints.forEach((p, idx) => {
      const dist = Math.abs(p.x - relative);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIndex = idx;
      }
    });
    setHoveredIndex(nearestIndex);
  };

  const handleChartLeave = () => {
    setHoveredIndex(null);
  };

  return (
    <div className="calendar-page">
      <h1 className="calendar-page__title">Calendar</h1>

      <div className="calendar-summary-row">
        <div className="calendar-summary-left">
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
                  {salaryPayDay != null ? `Pay day: ${salaryPayDay}` : 'No salary day set'}
                </span>
              </div>
              <div className="calendar-salary__actions">
                <button
                  type="button"
                  className="calendar-salary__svg-btn"
                  onClick={startSalaryEdit}
                  title="Edit"
                >
                  <SalaryEditIcon />
                </button>
                <button
                  type="button"
                  className="calendar-salary__add-btn"
                  onClick={handleAddSalaryNow}
                  disabled={!monthlySalary}
                >
                  Add salary
                </button>
              </div>
            </div>
          )}
          </div>
          <div className="calendar-progress-wrap">
            <div className="calendar-progress">
              {spentThisMonth > 0 && spentByCategorySegments.length > 0 ? (
                <div className="calendar-progress__filled" style={{ width: `${progressPercent}%` }}>
                  {spentByCategorySegments.map((seg) => (
                    <div
                      key={seg.categoryId || 'uncategorized'}
                      className="calendar-progress__value--spent"
                      style={{
                        flex: seg.amount / spentThisMonth,
                        background: seg.color,
                        boxShadow: `0 4px 20px -4px ${seg.color}`,
                      }}
                      title={`${seg.name}: $${seg.amount.toFixed(0)}`}
                    />
                  ))}
                </div>
              ) : (
                <div
                  className="calendar-progress__value calendar-progress__value--spent"
                  style={{ width: `${progressPercent}%` }}
                />
              )}
            </div>
            <p className="calendar-progress__label">
              Spent: ${spentThisMonth.toFixed(0)} / ${monthlySalary.toFixed(0)} ({progressPercent.toFixed(0)}%)
            </p>
            {spentThisMonth > 0 && spentByCategorySegments.length > 0 && (
              <ul className="calendar-progress__by-category">
                {spentByCategorySegments.map((seg) => (
                  <li key={seg.categoryId || 'uncategorized'} className="calendar-progress__category-row">
                    <span className="calendar-progress__category-dot" style={{ backgroundColor: seg.color }} />
                    <span className="calendar-progress__category-name">{seg.name}</span>
                    <span className="calendar-progress__category-amount">${seg.amount.toFixed(0)}</span>
                    <span className="calendar-progress__category-pct">({seg.percentOfSpent.toFixed(0)}%)</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="calendar-chart-card">
          <div className="calendar-chart-card__header">
            <div>
              <div className="calendar-chart-card__label">Wallet value</div>
              <div className="calendar-chart-card__value">
                ${activePoint ? activePoint.balance.toFixed(2) : cardBalance.toFixed(2)}
              </div>
              {activePoint && (
                <div className="calendar-chart-card__sub">
                  {activePoint.date.toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                  {chartRange === '1w' && (
                    <span className="calendar-chart-card__sub-time">
                      {' · '}
                      {activePoint.date.toLocaleTimeString('en-GB', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                      })}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="calendar-chart-card__range">
              {[
                { id: '1w', label: '1w' },
                { id: '1m', label: '1m' },
                { id: '6m', label: '6m' },
                { id: '1y', label: '1y' },
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={`calendar-chart-card__range-btn ${
                    chartRange === r.id ? 'calendar-chart-card__range-btn--active' : ''
                  }`}
                  onClick={() => setChartRange(r.id)}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <div className="calendar-chart">
            <svg
              viewBox="0 0 100 36"
              preserveAspectRatio="none"
              className="calendar-chart__svg"
              onMouseMove={handleChartMove}
              onMouseLeave={handleChartLeave}
            >
              <defs>
                <linearGradient id="calendarChartLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="var(--primary)" />
                  <stop offset="100%" stopColor="var(--primary-hover)" />
                </linearGradient>
                <linearGradient id="calendarChartFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(46, 204, 113, 0.3)" />
                  <stop offset="100%" stopColor="rgba(46, 204, 113, 0)" />
                </linearGradient>
              </defs>
              {normalizedPoints.length > 0 && (
                <>
                  <path
                    className="calendar-chart__area"
                    d={areaPathD}
                    fill="url(#calendarChartFill)"
                  />
                  <path
                    className="calendar-chart__line"
                    d={linePathD}
                    stroke="url(#calendarChartLine)"
                    fill="none"
                  />
                  {activePoint && (
                    <>
                      <line
                        className="calendar-chart__cursor-line"
                        x1={activePoint.x}
                        y1="0"
                        x2={activePoint.x}
                        y2="36"
                      />
                      <circle
                        className="calendar-chart__dot"
                        cx={activePoint.x}
                        cy={(activePoint.y / 100) * 35.5}
                        r="0.8"
                      />
                    </>
                  )}
                </>
              )}
            </svg>
            <div className={`calendar-chart__axis ${chartAxisLabels.length === 0 ? 'calendar-chart__axis--invisible' : ''}`}>
              {chartAxisLabels.map((item, idx) => (
                <span
                  key={idx}
                  className="calendar-chart__axis-tick"
                  style={{ left: `${item.x}%` }}
                >
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        </div>
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
          onClick={() => { setSelectedDay(null); setShowNewCategoryPopup(false); }}
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
                onClick={() => { setSelectedDay(null); setShowNewCategoryPopup(false); }}
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
                  {selectedEntries.map((entry) => {
                    const cat = getCategoryById(entry.categoryId);
                    const defaultBorder = entry.type === 'remove' ? 'var(--red)' : 'var(--primary)';
                    const borderColor = cat ? cat.color : defaultBorder;
                    return (
                    <li
                      key={entry.id}
                      className={`calendar-modal__item calendar-modal__item--${entry.type} ${isSelectedDayFuture ? 'calendar-modal__item--scheduled' : ''}`}
                      style={{ borderLeftColor: borderColor }}
                    >
                      <span className="calendar-modal__item-text">
                        {cat && <span className="calendar-modal__item-cat" style={{ color: cat.color }}>[{cat.name}] </span>}
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
                    );
                  })}
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
                  {savedItems.map((item) => {
                    const cat = getCategoryById(item.categoryId);
                    const defaultBorder = item.type === 'remove' ? 'var(--red)' : 'var(--primary)';
                    const borderColor = cat ? cat.color : defaultBorder;
                    return (
                    <li
                      key={item.id}
                      className={`calendar-modal__saved-item calendar-modal__saved-item--${item.type}`}
                      style={{ borderLeftColor: borderColor }}
                    >
                      <span className="calendar-modal__saved-item-text">
                        {cat && <span className="calendar-modal__item-cat" style={{ color: cat.color }}>[{cat.name}] </span>}
                        {item.name}: ${item.amount}
                      </span>
                      <div className="calendar-modal__saved-item-actions">
                        <button type="button" className="calendar-modal__btn calendar-modal__btn--add calendar-modal__btn--small" onClick={() => addSavedToDay(item)}>
                          Add to this day
                        </button>
                        <button type="button" className="calendar-modal__item-delete" onClick={() => removeSavedItem(item.id)}>Remove</button>
                      </div>
                    </li>
                    );
                  })}
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
                  <label className="calendar-modal__saved-type">
                    <span>Категория:</span>
                    <select value={newSavedCategoryId} onChange={(e) => setNewSavedCategoryId(e.target.value)}>
                      <option value="">Некатегоризирани</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <button type="button" className="calendar-modal__btn calendar-modal__btn--small calendar-modal__btn--outline" onClick={() => setShowNewCategoryPopup(true)}>
                      Нова категория
                    </button>
                  </label>
                  <button type="submit" className="calendar-modal__btn calendar-modal__btn--add">Save item</button>
                </form>
              </div>
            )}

            {showNewCategoryPopup && (
              <div className="calendar-category-popup-overlay" onClick={() => setShowNewCategoryPopup(false)}>
                <div className="calendar-category-popup" onClick={(e) => e.stopPropagation()}>
                  <h3 className="calendar-category-popup__title">Нова категория</h3>
                  <form className="calendar-category-popup__form" onSubmit={(e) => { if (addCategory(e)) setShowNewCategoryPopup(false); }}>
                    <label className="calendar-category-popup__label">
                      <span>Име</span>
                      <input
                        type="text"
                        placeholder="напр. Храна, Наем"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="calendar-category-popup__input"
                        autoFocus
                      />
                    </label>
                    <label className="calendar-category-popup__label">
                      <span>Цвят</span>
                      <div className="calendar-color-picker">
                        {DEFAULT_CATEGORY_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            className={`calendar-color-picker__swatch ${newCategoryColor === color ? 'calendar-color-picker__swatch--selected' : ''}`}
                            style={{ backgroundColor: color }}
                            onClick={() => setNewCategoryColor(color)}
                            title={color}
                          />
                        ))}
                        {!DEFAULT_CATEGORY_COLORS.includes(newCategoryColor) && (
                          <span
                            className="calendar-color-picker__swatch calendar-color-picker__swatch--selected"
                            style={{ backgroundColor: newCategoryColor }}
                            title="Избран цвят"
                          />
                        )}
                        <label className="calendar-color-picker__custom">
                          <span className="calendar-color-picker__custom-label">Друг</span>
                          <input
                            type="color"
                            value={newCategoryColor}
                            onChange={(e) => setNewCategoryColor(e.target.value)}
                            className="calendar-color-picker__custom-input"
                          />
                        </label>
                      </div>
                    </label>
                    <div className="calendar-category-popup__actions">
                      <button type="submit" className="calendar-modal__btn calendar-modal__btn--add">
                        Създай
                      </button>
                      <button type="button" className="calendar-modal__btn calendar-modal__btn--outline" onClick={() => setShowNewCategoryPopup(false)}>
                        Отказ
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Calendar;
