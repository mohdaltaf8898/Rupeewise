import React, { useState } from 'react';
import { VIEWS, CATEGORY_ICONS } from './constants.js';
import { inr, dateFmt, todayISO, toISODate, initials } from './format.js';
import { api } from './api.js';

/* ------------------------------- Sidebar ------------------------------- */

export function Sidebar({ view, onNavigate, profile, open, onClose }) {
  return (
    <>
      <aside className={open ? 'open' : ''}>
        <div className="brand">
          <span>₹</span>RupeeWise
        </div>
        <nav>
          {VIEWS.map((v) => (
            <a
              key={v.id}
              className={view === v.id ? 'active' : ''}
              onClick={() => {
                onNavigate(v.id);
                onClose();
              }}
            >
              <span className="navico">{v.icon}</span> <b>{v.label}</b>
            </a>
          ))}
        </nav>
        <div className="sidefoot">
          <div className="avatar">{initials(profile)}</div>
          <div>
            <b>{profile}</b>
            <small>Personal account</small>
          </div>
        </div>
      </aside>
      {open && <div className="shade" onClick={onClose} />}
    </>
  );
}

/* -------------------------------- Header ------------------------------- */

export function Header({ eyebrow, title, subtitle, onMenu, onAdd, addLabel = 'Add expense' }) {
  return (
    <header>
      <button className="hamb" onClick={onMenu} aria-label="Open menu">
        ☰
      </button>
      <div className="headtext">
        <small>{eyebrow}</small>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <button className="primary" onClick={onAdd}>
        ＋ {addLabel}
      </button>
    </header>
  );
}

/* ------------------------------ Stat cards ----------------------------- */

export function StatCards({ stats }) {
  const diff = stats.thisMonth.total - stats.lastMonth.total;
  const trend =
    stats.lastMonth.total > 0 ? Math.round((diff / stats.lastMonth.total) * 100) : stats.thisMonth.total > 0 ? 100 : 0;

  return (
    <section className="cards">
      <div className="card feature">
        <div>
          <label>Total expenses</label>
          <h2>{inr(stats.total)}</h2>
          <small>Across {stats.count} transaction{stats.count === 1 ? '' : 's'}</small>
        </div>
        <i>₹</i>
      </div>
      <div className="card">
        <label>This month</label>
        <h2>{inr(stats.thisMonth.total)}</h2>
        <small>
          <em>{stats.thisMonth.count}</em> transactions
          {stats.thisMonth.total > 0 || stats.lastMonth.total > 0 ? (
            <>
              {' '}
              · <span className={diff <= 0 ? 'down' : 'up'}>{diff <= 0 ? '▼' : '▲'} {Math.abs(trend)}%</span> vs last month
            </>
          ) : null}
        </small>
      </div>
      <div className="card">
        <label>Average expense</label>
        <h2>{inr(stats.avg)}</h2>
        <small>Per transaction</small>
      </div>
    </section>
  );
}

/* ---------------------------- Transactions ----------------------------- */

export function TransactionRow({ expense, onEdit, onDelete }) {
  const x = expense;
  return (
    <div className="tr">
      <span className="tx">
        <i>{CATEGORY_ICONS[x.category] || '•••'}</i>
        <span>
          <b>{x.title}</b>
          <small>{x.note || 'No note'}</small>
        </span>
      </span>
      <span>
        <mark>{x.category}</mark>
      </span>
      <span>{dateFmt(x.date)}</span>
      <strong>-{inr(x.amount)}</strong>
      <span className="actions">
        <button onClick={() => onEdit(x)} aria-label={`Edit ${x.title}`} title="Edit">
          ✎
        </button>
        <button onClick={() => onDelete(x)} aria-label={`Delete ${x.title}`} title="Delete">
          ⌫
        </button>
      </span>
    </div>
  );
}

export function EmptyState({ title, subtitle, actionLabel, onAction }) {
  return (
    <div className="empty">
      <b>{title}</b>
      <small>{subtitle}</small>
      {actionLabel ? <button onClick={onAction}>{actionLabel}</button> : null}
    </div>
  );
}

export function Pagination({ page, pages, total, limit, onPage }) {
  if (pages <= 1) return null;
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  return (
    <div className="pager">
      <small>
        Showing {start}–{end} of {total}
      </small>
      <div>
        <button disabled={page <= 1} onClick={() => onPage(page - 1)}>
          ← Prev
        </button>
        <span>
          Page {page} of {pages}
        </span>
        <button disabled={page >= pages} onClick={() => onPage(page + 1)}>
          Next →
        </button>
      </div>
    </div>
  );
}

/* ------------------------------ Add/Edit ------------------------------- */

const blankForm = () => ({ title: '', amount: '', category: 'Food & Dining', date: todayISO(), note: '' });

export function ExpenseModal({ expense, categories, onClose, onSaved, notify }) {
  const [form, setForm] = useState(() =>
    expense
      ? {
          title: expense.title,
          amount: expense.amount,
          category: expense.category,
          date: toISODate(expense.date),
          note: expense.note || '',
        }
      : blankForm()
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (expense) {
        await api.updateExpense(expense._id, form);
        notify('Expense updated');
      } else {
        await api.createExpense(form);
        notify('Expense added');
      }
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal" onSubmit={save}>
        <div className="modalHead">
          <div>
            <h2>{expense ? 'Edit expense' : 'Add new expense'}</h2>
            <p>Keep your spending up to date.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {error ? <div className="formError">{error}</div> : null}

        <label>
          Expense title
          <input
            autoFocus
            required
            maxLength={80}
            placeholder="e.g. Dinner with friends"
            value={form.title}
            onChange={(e) => set({ title: e.target.value })}
          />
        </label>

        <div className="formrow">
          <label>
            Amount (₹)
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => set({ amount: e.target.value })}
            />
          </label>
          <label>
            Date
            <input required type="date" value={form.date} onChange={(e) => set({ date: e.target.value })} />
          </label>
        </div>

        <label>
          Category
          <select value={form.category} onChange={(e) => set({ category: e.target.value })}>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>

        <label>
          Note <small>(optional)</small>
          <textarea
            maxLength={240}
            placeholder="Add a short note"
            value={form.note}
            onChange={(e) => set({ note: e.target.value })}
          />
        </label>

        <div className="modalActions">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary" disabled={saving}>
            {saving ? 'Saving…' : expense ? 'Save changes' : 'Add expense'}
          </button>
        </div>
      </form>
    </div>
  );
}

/* --------------------------- Confirm + Toast --------------------------- */

export function ConfirmDialog({ title, message, confirmLabel = 'Delete', danger = true, busy, onConfirm, onCancel }) {
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal confirm">
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="modalActions">
          <button onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button className={danger ? 'danger' : 'primary'} onClick={onConfirm} disabled={busy}>
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Toast({ message }) {
  if (!message) return null;
  return <div className="toast">✓ {message}</div>;
}
