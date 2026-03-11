import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = (userId) => `nestsync_calendar_${userId ?? 'guest'}`;

export function toDateKey(date) {
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

export const DEFAULT_CATEGORY_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'];

export function useCalendarData(user) {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth());
  const [monthlySalary, setMonthlySalary] = useState(0);
  const [salaryEditing, setSalaryEditing] = useState(true);
  const [salaryInput, setSalaryInput] = useState('');
  const [salaryPayDay, setSalaryPayDay] = useState(null);
  const [cardBalance, setCardBalance] = useState(0);
  const [lastSalaryAdd, setLastSalaryAdd] = useState(null);
  const [entries, setEntries] = useState({});
  const [savedItems, setSavedItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState(DEFAULT_CATEGORY_COLORS[0]);
  const [newSavedCategoryId, setNewSavedCategoryId] = useState('');
  const [newSavedName, setNewSavedName] = useState('');
  const [newSavedAmount, setNewSavedAmount] = useState('');
  const [newSavedType, setNewSavedType] = useState('remove');

  const key = STORAGE_KEY(user?.id);
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

  const updateAndSave = (next) => {
    saveData({
      monthlySalary,
      salaryPayDay,
      cardBalance: next.cardBalance ?? cardBalance,
      lastSalaryAdd: next.lastSalaryAdd ?? lastSalaryAdd,
      entries: next.entries ?? entries,
      savedItems: next.savedItems ?? savedItems,
      categories: next.categories ?? categories,
    });
  };

  const handleSalarySave = () => {
    const num = Number(salaryInput) || 0;
    setMonthlySalary(num);
    setSalaryEditing(false);
    setSalaryInput('');
    updateAndSave({});
  };

  const startSalaryEdit = () => {
    setSalaryEditing(true);
    setSalaryInput(monthlySalary > 0 ? String(monthlySalary) : '');
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
    updateAndSave({ lastSalaryAdd: nextLast });
  };

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
    const nextEntries = { ...entries, [dateKey]: [...list, entry] };
    const isFuture = isDateKeyFuture(dateKey);
    const newBalance = isFuture ? cardBalance : (type === 'remove' ? cardBalance - amt : cardBalance + amt);
    setEntries(nextEntries);
    setCardBalance(newBalance);
    updateAndSave({ entries: nextEntries, cardBalance: newBalance });
  };

  const removeEntry = (dateKey, entryId) => {
    const list = entries[dateKey] ?? [];
    const entry = list.find((e) => e.id === entryId);
    if (!entry) return;
    const nextList = list.filter((e) => e.id !== entryId);
    const nextEntries = { ...entries, [dateKey]: nextList };
    if (nextList.length === 0) delete nextEntries[dateKey];
    const isFuture = isDateKeyFuture(dateKey);
    const delta = isFuture ? 0 : (entry.type === 'remove' ? entry.amount : -entry.amount);
    const newBalance = cardBalance + delta;
    setEntries(nextEntries);
    setCardBalance(newBalance);
    updateAndSave({ entries: nextEntries, cardBalance: newBalance });
  };

  const addCategory = (e) => {
    e?.preventDefault?.();
    const name = (newCategoryName || '').trim();
    if (!name) return false;
    const cat = {
      id: `cat-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name,
      color: newCategoryColor,
    };
    const nextCategories = [...categories, cat];
    setCategories(nextCategories);
    setNewCategoryName('');
    setNewCategoryColor(DEFAULT_CATEGORY_COLORS[nextCategories.length % DEFAULT_CATEGORY_COLORS.length]);
    updateAndSave({ categories: nextCategories });
    return true;
  };

  const removeCategory = (catId) => {
    const nextCategories = categories.filter((c) => c.id !== catId);
    setCategories(nextCategories);
    updateAndSave({ categories: nextCategories });
  };

  const saveNewSavedItem = (e) => {
    e?.preventDefault?.();
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
    const nextSaved = [...savedItems, item];
    setSavedItems(nextSaved);
    setNewSavedName('');
    setNewSavedAmount('');
    setNewSavedCategoryId('');
    updateAndSave({ savedItems: nextSaved });
  };

  const removeSavedItem = (itemId) => {
    const nextSaved = savedItems.filter((i) => i.id !== itemId);
    setSavedItems(nextSaved);
    updateAndSave({ savedItems: nextSaved });
  };

  return {
    year,
    month,
    setYear,
    setMonth,
    monthlySalary,
    setMonthlySalary,
    salaryEditing,
    salaryInput,
    setSalaryInput,
    salaryPayDay,
    cardBalance,
    lastSalaryAdd,
    entries,
    savedItems,
    categories,
    newCategoryName,
    setNewCategoryName,
    newCategoryColor,
    setNewCategoryColor,
    newSavedCategoryId,
    setNewSavedCategoryId,
    newSavedName,
    setNewSavedName,
    newSavedAmount,
    setNewSavedAmount,
    newSavedType,
    setNewSavedType,
    loadData,
    handleSalarySave,
    startSalaryEdit,
    handleAddSalaryNow,
    addEntry,
    removeEntry,
    addCategory,
    removeCategory,
    saveNewSavedItem,
    removeSavedItem,
  };
}

