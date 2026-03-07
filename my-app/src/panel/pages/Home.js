import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE } from '../../api';
import './Home.css';

function Home() {
  const { user } = useAuth();
  const displayName = user?.username || user?.email?.split('@')[0] || 'User';
  const balance = user?.initialCardAmount ?? 0;

  const [monthlySalary, setMonthlySalary] = useState(3000);
  const [amountSpent, setAmountSpent] = useState(0);
  const spentPercent = monthlySalary > 0 ? Math.min(100, (amountSpent / monthlySalary) * 100) : 0;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyStart = Array(firstDay).fill(null);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

      <div className="dashboard-grid">
        <section className="dashboard-card dashboard-card--income">
          <h2 className="dashboard-card__title">Income &amp; Wallet</h2>
          <p className="dashboard-card__amount">{Number(balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <p className="dashboard-card__label">Wallet value</p>
        </section>

        <section className="dashboard-card dashboard-card--progress">
          <h2 className="dashboard-card__title">Monthly saving progress</h2>
          <p className="dashboard-card__hint">Salary vs spent this month</p>
          <div className="dashboard-progress__inputs">
            <label>
              <span>Monthly salary</span>
              <input
                type="number"
                min="0"
                step="100"
                value={monthlySalary}
                onChange={(e) => setMonthlySalary(Number(e.target.value) || 0)}
              />
            </label>
            <label>
              <span>Amount spent</span>
              <input
                type="number"
                min="0"
                step="50"
                value={amountSpent}
                onChange={(e) => setAmountSpent(Number(e.target.value) || 0)}
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

        <section className="dashboard-card dashboard-card--calendar">
          <h2 className="dashboard-card__title">Calendar</h2>
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
                <span
                  key={d}
                  className={`dashboard-calendar__day${d === now.getDate() ? ' dashboard-calendar__day--today' : ''}`}
                >
                  {d}
                </span>
              ))}
            </div>
            <p className="dashboard-calendar__month">
              {now.toLocaleString('en-US', { month: 'long' })} {year}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Home;
