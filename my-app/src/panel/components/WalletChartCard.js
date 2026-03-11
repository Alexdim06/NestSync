import React, { useState, useMemo } from 'react';
import { toDateKey } from '../hooks/useCalendarData';

function buildTimelineFromEvents(entries, cardBalance, daysBack) {
  const points = [];
  const base = new Date();
  for (let i = daysBack; i >= 0; i--) {
    const d = new Date(base);
    d.setDate(d.getDate() - i);
    const dateKey = toDateKey(d);
    let balance = 0;
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
    points.push({ date: d, balance });
  }
  points.push({ date: new Date(), balance: cardBalance });
  points.sort((a, b) => a.date.getTime() - b.date.getTime());
  points[points.length - 1] = { date: new Date(), balance: cardBalance };
  return points;
}

function buildSmoothPath(points, height) {
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
}

export default function WalletChartCard({ entries, cardBalance, monthlySalary, compact = false }) {
  const [chartRange, setChartRange] = useState('1m');
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const balanceTimeline = useMemo(() => {
    switch (chartRange) {
      case '1w':
        return buildTimelineFromEvents(entries, cardBalance, 7);
      case '6m':
        return buildTimelineFromEvents(entries, cardBalance, 180);
      case '1y':
        return buildTimelineFromEvents(entries, cardBalance, 365);
      case '1m':
      default:
        return buildTimelineFromEvents(entries, cardBalance, 30);
    }
  }, [chartRange, entries, cardBalance]);

  const { normalizedPoints, activePoint, linePathD, areaPathD } = useMemo(() => {
    if (!balanceTimeline.length) {
      return { normalizedPoints: [], activePoint: null, linePathD: '', areaPathD: '' };
    }
    const rawMaxBalance = Math.max(...balanceTimeline.map((p) => p.balance));
    const minBalance = Math.min(...balanceTimeline.map((p) => p.balance));
    const maxBalance =
      rawMaxBalance === minBalance
        ? rawMaxBalance || 0
        : rawMaxBalance + Math.abs(rawMaxBalance - minBalance) * 0.3;
    const points = balanceTimeline.map((p, idx) => {
      const x = (idx / Math.max(1, balanceTimeline.length - 1)) * 100;
      const range = maxBalance - minBalance || 1;
      const rawY = 100 - ((p.balance - minBalance) / range) * 100;
      const y = 10 + (rawY / 100) * 80;
      return { x, y, date: p.date, balance: p.balance };
    });
    const lp = buildSmoothPath(points, 36);
    const ap = lp && points.length > 0
      ? `${lp} L ${points[points.length - 1].x} 36 L ${points[0].x} 36 Z`
      : '';
    return {
      normalizedPoints: points,
      activePoint: points[hoveredIndex != null ? hoveredIndex : points.length - 1],
      linePathD: lp,
      areaPathD: ap,
    };
  }, [balanceTimeline, hoveredIndex]);

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
    <div className={`calendar-chart-card calendar-chart-card--widget ${compact ? 'calendar-chart-card--compact' : ''}`}>
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
            </div>
          )}
        </div>
        {!compact && (
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
        )}
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
      </div>
    </div>
  );
}

