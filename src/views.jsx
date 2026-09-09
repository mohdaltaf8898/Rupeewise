import React, { useEffect, useMemo, useState } from 'react';
import { CATEGORIES, CATEGORY_ICONS, colorFor } from './constants.js';
import { inr, dateFmt, greeting } from './format.js';
import { api } from './api.js';
import {
  Header,
  StatCards,
  TransactionRow,
  EmptyState,
  Pagination,
} from './components.jsx';
import { TrendChart, CategoryDonut } from './charts.jsx';

const EMPTY_STATS = {
  total: 0,
  count: 0,
  avg: 0,
  thisMonth: { total: 0, count: 0 },
  lastMonth: { total: 0, count: 0 },
  byCategory: [],
  monthly: [],
};

/* ------------------------------- Overview ------------------------------ */

export function OverviewView({ signal, profile, onMenu, onAdd, onEdit, onDelete, onViewAll }) {
  const [stats, setStats] = useState(EMPTY_STATS);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([api.stats(), api.listExpenses({ limit: 8 })])
      .then(([s, list]) => {
        if (!alive) return;
        setStats(s);
        setRecent(list.data);
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [signal]);

  return (
    <>
      <Header
        eyebrow="FINANCIAL OVERVIEW"
        title={`${greeting()} 👋`}
        subtitle="Here’s what’s happening with your money."
        onMenu={onMenu}
        onAdd={onAdd}
      />
      <StatCards stats={stats} />
      <section className="charts">
        <TrendChart data={stats.monthly} />
        <CategoryDonut data={stats.byCategory} total={stats.total} />
      </section>
      <section className="panel transactions">
        <div className="panelHead">
          <div>
            <h3>Recent transactions</h3>
            <p>Your latest expenses</p>
          </div>
          <button className="ghost" onClick={onViewAll}>
            View all →
          </button>
        </div>
        <div className="table">
          <div className="tr th">
            <span>TRANSACTION</span>
            <span>CATEGORY</span>
            <span>DATE</span>
            <span>AMOUNT</span>
            <span />
          </div>
          {loading ? (
            <div className="empty">Loading expenses…</div>
          ) : !recent.length ? (
            <EmptyState
              title="No expenses found"
              subtitle="Add your first expense to see insights."
              actionLabel="Add expense"
              onAction={onAdd}
            />
          ) : (
            recent.map((x) => <TransactionRow key={x._id} expense={x} onEdit={onEdit} onDelete={onDelete} />)
          )}
        </div>
      </section>
    </>
  );
}

/* ----------------------------- Transactions ---------------------------- */

export function TransactionsView({
  signal,
  presetCategory,
  onPresetConsumed,
  onMenu,
  onAdd,
  onEdit,
  onDelete,
  notify,
}) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [sort, setSort] = useState('date');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [result, setResult] = useState({ data: [], total: 0, pages: 1, page: 1 });
  const [loading, setLoading] = useState(true);

  // Category shortcut coming from the Categories view.
  useEffect(() => {
    if (presetCategory) {
      setCategory(presetCategory);
      setPage(1);
      onPresetConsumed();
    }
  }, [presetCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api
      .listExpenses({ search: debouncedSearch, category, from, to, sort, order, page, limit })
      .then((r) => alive && setResult(r))
      .catch((e) => alive && notify(e.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [debouncedSearch, category, from, to, sort, order, page, limit, signal]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasFilters = debouncedSearch || category !== 'all' || from || to;

  function clearFilters() {
    setSearch('');
    setDebouncedSearch('');
    setCategory('all');
    setFrom('');
    setTo('');
    setPage(1);
  }

  function toggleSort(field) {
    if (sort === field) {
      setOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSort(field);
      setOrder(field === 'title' ? 'asc' : 'desc');
    }
    setPage(1);
  }

  const sortArrow = (field) => (sort === field ? (order === 'asc' ? ' ↑' : ' ↓') : '');

  const totalShown = useMemo(() => result.data.reduce((s, x) => s + x.amount, 0), [result.data]);

  return (
    <>
      <Header
        eyebrow="ALL TRANSACTIONS"
        title="Transactions"
        subtitle={`${result.total} expense${result.total === 1 ? '' : 's'}${hasFilters ? ' match your filters' : ' tracked'}.`}
        onMenu={onMenu}
        onAdd={onAdd}
      />

      <section className="panel filterpanel">
        <div className="filters full">
          <div className="search grow">
            ⌕
            <input aria-label="Search" placeholder="Search title or note…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select aria-label="Category" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input aria-label="From date" type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
          <input aria-label="To date" type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} />
          <select aria-label="Rows per page" value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}>
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
          </select>
        </div>
        <div className="filterfoot">
          <small>
            Page total: <b>{inr(totalShown)}</b>
          </small>
          <div>
            {hasFilters ? (
              <button className="ghost" onClick={clearFilters}>
                Clear filters
              </button>
            ) : null}
            <a
              className="ghost"
              href={api.exportUrl({ search: debouncedSearch, category, from, to, sort, order })}
              download
            >
              ⬇ Export CSV
            </a>
          </div>
        </div>
      </section>

      <section className="panel transactions">
        <div className="table">
          <div className="tr th">
            <button className="sortth" onClick={() => toggleSort('title')}>TRANSACTION{sortArrow('title')}</button>
            <span>CATEGORY</span>
            <button className="sortth" onClick={() => toggleSort('date')}>DATE{sortArrow('date')}</button>
            <button className="sortth" onClick={() => toggleSort('amount')}>AMOUNT{sortArrow('amount')}</button>
            <span />
          </div>
          {loading ? (
            <div className="empty">Loading expenses…</div>
          ) : !result.data.length ? (
            <EmptyState
              title={hasFilters ? 'No matching expenses' : 'No expenses yet'}
              subtitle={hasFilters ? 'Try adjusting your search or filters.' : 'Add your first expense to get started.'}
              actionLabel={hasFilters ? 'Clear filters' : 'Add expense'}
              onAction={hasFilters ? clearFilters : onAdd}
            />
          ) : (
            result.data.map((x) => <TransactionRow key={x._id} expense={x} onEdit={onEdit} onDelete={onDelete} />)
          )}
        </div>
        <Pagination page={result.page} pages={result.pages} total={result.total} limit={limit} onPage={setPage} />
      </section>
    </>
  );
}

/* ------------------------------ Categories ----------------------------- */

export function CategoriesView({ signal, onMenu, onAdd, onSelect }) {
  const [stats, setStats] = useState(EMPTY_STATS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api
      .stats()
      .then((s) => alive && setStats(s))
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [signal]);

  const max = Math.max(1, ...stats.byCategory.map((c) => c.total));

  return (
    <>
      <Header
        eyebrow="SPENDING BREAKDOWN"
        title="Categories"
        subtitle="See where your money goes, then drill into any category."
        onMenu={onMenu}
        onAdd={onAdd}
      />
      {loading ? (
        <div className="panel"><div className="empty">Loading categories…</div></div>
      ) : !stats.byCategory.length ? (
        <div className="panel">
          <EmptyState
            title="No spending yet"
            subtitle="Add an expense to see your category breakdown."
            actionLabel="Add expense"
            onAction={onAdd}
          />
        </div>
      ) : (
        <section className="catgrid">
          {stats.byCategory.map((c) => (
            <button key={c.name} className="panel catcard" onClick={() => onSelect(c.name)}>
              <div className="cathead">
                <i style={{ background: `${colorFor(c.name)}1a` }}>{CATEGORY_ICONS[c.name] || '•••'}</i>
                <div>
                  <b>{c.name}</b>
                  <small>{c.count} transaction{c.count === 1 ? '' : 's'}</small>
                </div>
                <span className="pct">{c.percent}%</span>
              </div>
              <h2>{inr(c.total)}</h2>
              <div className="bar">
                <span style={{ width: `${Math.round((c.total / max) * 100)}%`, background: colorFor(c.name) }} />
              </div>
              <small className="drill">View transactions →</small>
            </button>
          ))}
        </section>
      )}
    </>
  );
}

/* ------------------------------- Settings ------------------------------ */

export function SettingsView({ signal, profile, onProfileChange, onMenu, onAdd, notify, onDeleteAll }) {
  const [health, setHealth] = useState(null);
  const [name, setName] = useState(profile);

  useEffect(() => {
    let alive = true;
    api
      .health()
      .then((h) => alive && setHealth(h))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [signal]);

  useEffect(() => setName(profile), [profile]);

  function saveProfile(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      notify('Name cannot be empty');
      return;
    }
    onProfileChange(trimmed);
    notify('Profile updated');
  }

  return (
    <>
      <Header
        eyebrow="PREFERENCES"
        title="Settings"
        subtitle="Manage your profile and your expense data."
        onMenu={onMenu}
        onAdd={onAdd}
      />
      <section className="setgrid">
        <div className="panel">
          <h3>Profile</h3>
          <p>This name shows in the sidebar.</p>
          <form className="setform" onSubmit={saveProfile}>
            <label>
              Display name
              <input maxLength={40} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </label>
            <button className="primary" type="submit">
              Save changes
            </button>
          </form>
        </div>

        <div className="panel">
          <h3>Your data</h3>
          <p>Stored in {health?.database === 'memory-demo' ? 'ephemeral demo memory' : 'MongoDB'}.</p>
          <ul className="kv">
            <li>
              <span>Expenses tracked</span>
              <b>{health?.expenses ?? '—'}</b>
            </li>
            <li>
              <span>Database</span>
              <b>{health?.database ?? '—'}</b>
            </li>
            <li>
              <span>App version</span>
              <b>v{health?.version ?? '1.0.0'}</b>
            </li>
          </ul>
          <div className="setactions">
            <a className="ghost" href={api.exportUrl({})} download>
              ⬇ Export CSV
            </a>
            <button className="danger outline" onClick={onDeleteAll}>
              Delete all data
            </button>
          </div>
        </div>

        <div className="panel">
          <h3>About RupeeWise</h3>
          <p>
            A simple, premium expense tracker built with React, Express and MongoDB. All amounts are shown in
            Indian Rupees (₹).
          </p>
          <ul className="tips">
            <li>⌕ Search by title or note on the Transactions screen.</li>
            <li>◫ Click any category card to drill into its transactions.</li>
            <li>⬇ Export a CSV backup of your data anytime.</li>
          </ul>
          <p className="muted">Last checked: {health ? dateFmt(health.time) : '—'}</p>
        </div>
      </section>
    </>
  );
}
