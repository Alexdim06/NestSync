import { useState, useMemo, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_BASE } from '../../api';
import { useCalendarData } from '../hooks/useCalendarData';
import WalletChartCard from '../components/WalletChartCard';
import './Home.css';

const MAX_WIDGET_SLOTS = 6;

const DASHBOARD_LAYOUT_KEY = (userId) => `nestsync_dashboard_${userId ?? 'guest'}`;

const WIDGET_IDS = {
  WALLET: 'wallet',
  MINI_WALLET: 'miniWallet',
  SPENDING: 'spending',
  MONTH_CALENDAR: 'monthCalendar',
};

function MiniWalletWidget({ balance, navigate }) {
  return (
    <section className="dashboard-widget dashboard-widget--mini-wallet">
      <div className="dashboard-mini-card">
        <div className="dashboard-mini-card__chip" />
        <div className="dashboard-mini-card__brand">NestSync</div>
        <div className="dashboard-mini-card__balance">
          ${Number(balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </div>
        <button
          type="button"
          className="dashboard-mini-card__btn"
          onClick={() => navigate('/calendar')}
        >
          Manage in calendar
        </button>
      </div>
      <p className="dashboard-widget__hint">
        Use the Calendar page to add or remove money from your wallet.
      </p>
    </section>
  );
}

function SpendingWidget({ monthlySalary, amountSpent, onMonthlySalaryChange, onAmountSpentChange }) {
  const spentPercent = monthlySalary > 0 ? Math.min(100, (amountSpent / monthlySalary) * 100) : 0;

  return (
    <section className="dashboard-widget dashboard-widget--spending">
      <h2 className="dashboard-widget__title">Monthly saving progress</h2>
      <p className="dashboard-widget__hint">Salary vs spent this month</p>
      <div className="dashboard-progress__inputs">
        <label>
          <span>Monthly salary</span>
          <input
            type="number"
            min="0"
            step="100"
            value={monthlySalary}
            onChange={(e) => onMonthlySalaryChange(Number(e.target.value) || 0)}
          />
        </label>
        <label>
          <span>Amount spent</span>
          <input
            type="number"
            min="0"
            step="50"
            value={amountSpent}
            onChange={(e) => onAmountSpentChange(Number(e.target.value) || 0)}
          />
        </label>
      </div>
      <div className="dashboard-progress__bar-wrap">
        <div
          className="dashboard-progress__bar"
          style={{ width: `${spentPercent}%` }}
        />
      </div>
      <p className="dashboard-progress__text">
        {amountSpent.toLocaleString()} / {monthlySalary.toLocaleString()}
      </p>
    </section>
  );
}

function MonthCalendarWidget({ now }) {
  const [viewDate, setViewDate] = useState(() => new Date(now));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyStart = Array(firstDay).fill(null);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const isToday = (day) =>
    now.getFullYear() === year &&
    now.getMonth() === month &&
    now.getDate() === day;

  const goPrevMonth = () => {
    setViewDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  const goNextMonth = () => {
    setViewDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  const monthLabel = new Date(year, month, 1).toLocaleString('en-US', { month: 'long' });

  return (
    <section className="dashboard-widget dashboard-widget--calendar">
      <div className="calendar-nav calendar-nav--mini">
        <button
          type="button"
          className="calendar-nav__btn"
          onClick={goPrevMonth}
        >
          ←
        </button>
        <span className="calendar-nav__month">
          {monthLabel} {year}
        </span>
        <button
          type="button"
          className="calendar-nav__btn"
          onClick={goNextMonth}
        >
          →
        </button>
      </div>
      <div className="dashboard-calendar">
        <div className="dashboard-calendar__weekdays">
          {weekDays.map((d) => (
            <span key={d} className="dashboard-calendar__wd">{d}</span>
          ))}
        </div>
        <div className="dashboard-calendar__grid">
          {emptyStart.map((_, i) => (
            <span key={`e-${i}`} className="dashboard-calendar__day dashboard-calendar__day--empty" />
          ))}
          {days.map((d) => (
            <button
              key={d}
              type="button"
              className={`dashboard-calendar__day${isToday(d) ? ' dashboard-calendar__day--today' : ''}`}
            >
              {d}
            </button>
          ))}
        </div>
        <p className="dashboard-calendar__month">
          {monthLabel} {year}
        </p>
      </div>
    </section>
  );
}

const AVAILABLE_WIDGETS = [
  {
    id: WIDGET_IDS.WALLET,
    title: 'Wallet',
    render: ({ calendar }) => (
      <WalletChartCard
        entries={calendar.entries}
        cardBalance={calendar.cardBalance}
        monthlySalary={calendar.monthlySalary}
      />
    ),
  },
  {
    id: WIDGET_IDS.MINI_WALLET,
    title: 'Mini card',
    render: ({ balance, navigate }) => <MiniWalletWidget balance={balance} navigate={navigate} />,
  },
  {
    id: WIDGET_IDS.SPENDING,
    title: 'Spending',
    render: (props) => <SpendingWidget {...props} />,
  },
  {
    id: WIDGET_IDS.MONTH_CALENDAR,
    title: 'Month calendar',
    render: ({ now }) => <MonthCalendarWidget now={now} />,
  },
];

function Home() {
  const { user } = useAuth();
  const displayName = user?.username || user?.email?.split('@')[0] || 'User';
  const balance = user?.initialCardAmount ?? 0;

  const calendar = useCalendarData(user);

  const [monthlySalary, setMonthlySalary] = useState(3000);
  const [amountSpent, setAmountSpent] = useState(0);
  const [showWidgetPicker, setShowWidgetPicker] = useState(false);
  const [activeWidgets, setActiveWidgets] = useState([]);
  const [layoutLoaded, setLayoutLoaded] = useState(false);
  const [layoutDirty, setLayoutDirty] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingMax, setOnboardingMax] = useState(4);
  const [onboardingSelection, setOnboardingSelection] = useState([WIDGET_IDS.WALLET, WIDGET_IDS.SPENDING]);
  const navigate = useNavigate();

  const now = useMemo(() => new Date(), []);

  const widgetsById = useMemo(
    () => AVAILABLE_WIDGETS.reduce((acc, w) => {
      acc[w.id] = w;
      return acc;
    }, {}),
    []
  );

  const slots = useMemo(() => {
    const bySlot = Array.from({ length: MAX_WIDGET_SLOTS }, () => null);
    activeWidgets.forEach((w) => {
      if (w.slotIndex >= 0 && w.slotIndex < MAX_WIDGET_SLOTS && widgetsById[w.widgetId]) {
        bySlot[w.slotIndex] = w.widgetId;
      }
    });
    return bySlot;
  }, [activeWidgets, widgetsById]);

  useEffect(() => {
    if (!user) return;
    const key = DASHBOARD_LAYOUT_KEY(user.id);
    const raw = window.localStorage.getItem(key);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setActiveWidgets(parsed);
        }
      } catch {
        // ignore invalid layout
      }
      setShowOnboarding(false);
    } else {
      // default layout before first save; show onboarding
      setActiveWidgets([
        { slotIndex: 0, widgetId: WIDGET_IDS.WALLET },
        { slotIndex: 1, widgetId: WIDGET_IDS.SPENDING },
        { slotIndex: 2, widgetId: WIDGET_IDS.MONTH_CALENDAR },
      ]);
      setShowOnboarding(true);
    }
    setLayoutLoaded(true);
  }, [user]);

  const markDirtyAndSetWidgets = (updater) => {
    setActiveWidgets((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      setLayoutDirty(true);
      return next;
    });
  };

  const handleDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;
    const from = source.index;
    const to = destination.index;
    if (from === to) return;
    markDirtyAndSetWidgets((prev) => {
      const current = [...prev];
      const widgetAtFrom = current.find((w) => w.slotIndex === from);
      const widgetAtTo = current.find((w) => w.slotIndex === to);
      const next = current.filter(
        (w) => w.slotIndex !== from && w.slotIndex !== to
      );
      if (widgetAtFrom) {
        next.push({ ...widgetAtFrom, slotIndex: to });
      }
      if (widgetAtTo) {
        next.push({ ...widgetAtTo, slotIndex: from });
      }
      return next;
    });
  };

  const handleSaveLayout = () => {
    if (!user) return;
    const key = DASHBOARD_LAYOUT_KEY(user.id);
    window.localStorage.setItem(key, JSON.stringify(activeWidgets));
    setLayoutDirty(false);
  };

  const handleRemoveWidget = (slotIndex) => {
    markDirtyAndSetWidgets((prev) => prev.filter((w) => w.slotIndex !== slotIndex));
  };

  const handleOnboardingToggle = (widgetId) => {
    setOnboardingSelection((prev) => {
      if (prev.includes(widgetId)) {
        return prev.filter((id) => id !== widgetId);
      }
      if (prev.length >= onboardingMax) return prev;
      return [...prev, widgetId];
    });
  };

  const handleOnboardingConfirm = () => {
    const selected = onboardingSelection.slice(0, onboardingMax);
    const layout = selected.map((widgetId, index) => ({ slotIndex: index, widgetId }));
    if (!user) {
      markDirtyAndSetWidgets(layout);
      setShowOnboarding(false);
      return;
    }
    const key = DASHBOARD_LAYOUT_KEY(user.id);
    window.localStorage.setItem(key, JSON.stringify(layout));
    setActiveWidgets(layout);
    setLayoutDirty(false);
    setShowOnboarding(false);
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-header__user">
          {user?.profilePhotoUrl ? (
            <img
              src={`${API_BASE}${user.profilePhotoUrl}`}
              alt=""
              className="dashboard-header__avatar"
            />
          ) : (
            <div className="dashboard-header__avatar dashboard-header__avatar--placeholder">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="dashboard-header__greeting">Hello, {displayName}</span>
        </div>
      </header>
      <h1 className="dashboard-title">Dashboard</h1>

      <div className="dashboard-widgets-bar">
        <button
          type="button"
          className="dashboard-widgets-bar__btn"
          onClick={() => setShowWidgetPicker((v) => !v)}
        >
          Add widget
        </button>
        <button
          type="button"
          className="dashboard-widgets-bar__btn dashboard-widgets-bar__btn--primary"
          onClick={handleSaveLayout}
          disabled={!layoutDirty || !layoutLoaded}
        >
          Save layout
        </button>
        {showWidgetPicker && (
          <div className="dashboard-widgets-bar__dropdown">
            {AVAILABLE_WIDGETS.map((widget) => (
              <button
                key={widget.id}
                type="button"
                className="dashboard-widgets-bar__item"
                onClick={() => {
                  const firstEmpty = slots.findIndex((s) => s == null);
                  if (firstEmpty === -1) return;
                  markDirtyAndSetWidgets((prev) => [
                    ...prev.filter((w) => !(w.slotIndex === firstEmpty)),
                    { slotIndex: firstEmpty, widgetId: widget.id },
                  ]);
                  setShowWidgetPicker(false);
                }}
                disabled={slots.every((s) => s != null)}
              >
                {widget.title}
              </button>
            ))}
            <button
              type="button"
              className="dashboard-widgets-bar__item dashboard-widgets-bar__item--calendar-link"
              onClick={() => {
                navigate('/calendar');
                setShowWidgetPicker(false);
              }}
            >
              Open Calendar page
            </button>
          </div>
        )}
      </div>

      {layoutLoaded && (
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable
          droppableId="dashboard-widgets-grid"
          direction="horizontal"
          renderClone={(
            provided,
            snapshot,
            rubric,
          ) => {
            const widgetId = slots[rubric.source.index];
            const widget = widgetId ? widgetsById[widgetId] : null;
            return (
              <div
                ref={provided.innerRef}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
                className={`dashboard-widget-slot dashboard-widget-slot--dragging`}
              >
                {widget && widget.render({
                  balance,
                  monthlySalary,
                  amountSpent,
                  onMonthlySalaryChange: setMonthlySalary,
                  onAmountSpentChange: setAmountSpent,
                  now,
                  navigate,
                  calendar,
                })}
              </div>
            );
          }}
        >
          {(provided, snapshot) => (
            <div
              className={`dashboard-widgets-grid ${snapshot.isDraggingOver ? 'dashboard-widgets-grid--drag-over' : ''}`}
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {slots.map((widgetId, index) => {
                const widget = widgetId ? widgetsById[widgetId] : null;
                return (
                  <Draggable
                    key={`slot-${index}`}
                    draggableId={`slot-${index}`}
                    index={index}
                    isDragDisabled={!widget}
                  >
                    {(dragProvided, dragSnapshot) => (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        {...dragProvided.dragHandleProps}
                        className={`dashboard-widget-slot ${
                          dragSnapshot.isDragging ? 'dashboard-widget-slot--active' : ''
                        } ${!widget ? 'dashboard-widget-slot--empty-visible' : ''}`}
                      >
                        {widget
                          ? widget.render({
                              balance,
                              monthlySalary,
                              amountSpent,
                              onMonthlySalaryChange: setMonthlySalary,
                              onAmountSpentChange: setAmountSpent,
                              now,
                              navigate,
                              calendar,
                            })
                          : (
                            <div className="dashboard-widget-slot__empty">Empty slot</div>
                          )}
                        {widget && (
                          <button
                            type="button"
                            className="dashboard-widget-slot__remove"
                            onClick={() => handleRemoveWidget(index)}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      )}

      {showOnboarding && (
        <div className="dashboard-onboarding-overlay">
          <div className="dashboard-onboarding">
            <h2 className="dashboard-onboarding__title">Customize your dashboard</h2>
            <p className="dashboard-onboarding__subtitle">
              Choose which widgets you want to see. You can always rearrange them later.
            </p>
            <div className="dashboard-onboarding__sizes">
              {[2, 4, 6].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`dashboard-onboarding__size-btn ${onboardingMax === n ? 'dashboard-onboarding__size-btn--active' : ''}`}
                  onClick={() => {
                    setOnboardingMax(n);
                    setOnboardingSelection((prev) => prev.slice(0, n));
                  }}
                >
                  {n} widgets
                </button>
              ))}
            </div>
            <div className="dashboard-onboarding__widgets">
              {AVAILABLE_WIDGETS.map((w) => {
                const selected = onboardingSelection.includes(w.id);
                return (
                  <button
                    key={w.id}
                    type="button"
                    className={`dashboard-onboarding__widget-card ${selected ? 'dashboard-onboarding__widget-card--selected' : ''}`}
                    onClick={() => handleOnboardingToggle(w.id)}
                  >
                    <span className="dashboard-onboarding__widget-title">{w.title}</span>
                    <span className="dashboard-onboarding__widget-hint">
                      {w.id === WIDGET_IDS.WALLET && 'Full wallet chart'}
                      {w.id === WIDGET_IDS.MINI_WALLET && 'Mini card + quick access'}
                      {w.id === WIDGET_IDS.SPENDING && 'Monthly savings progress'}
                      {w.id === WIDGET_IDS.MONTH_CALENDAR && 'Mini calendar overview'}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="dashboard-onboarding__actions">
              <button
                type="button"
                className="dashboard-onboarding__btn dashboard-onboarding__btn--primary"
                onClick={handleOnboardingConfirm}
                disabled={onboardingSelection.length === 0}
              >
                Save & continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
