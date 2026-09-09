import React, { useCallback, useEffect, useState, lazy, Suspense } from 'react';
import { CATEGORIES } from './constants.js';
import { api } from './api.js';
import { Sidebar, ExpenseModal, ConfirmDialog, Toast } from './components.jsx';

// Code-split: views (incl. the recharts bundle) load after the app shell.
const OverviewView = lazy(() => import('./views.jsx').then((m) => ({ default: m.OverviewView })));
const TransactionsView = lazy(() => import('./views.jsx').then((m) => ({ default: m.TransactionsView })));
const CategoriesView = lazy(() => import('./views.jsx').then((m) => ({ default: m.CategoriesView })));
const SettingsView = lazy(() => import('./views.jsx').then((m) => ({ default: m.SettingsView })));

function ViewFallback() {
  return (
    <div className="panel">
      <div className="empty">Loading…</div>
    </div>
  );
}

const PROFILE_KEY = 'rupeewise_profile';

function loadProfile() {
  try {
    return localStorage.getItem(PROFILE_KEY) || 'Arjun Kumar';
  } catch {
    return 'Arjun Kumar';
  }
}

export default function App() {
  const [view, setView] = useState('overview');
  const [profile, setProfile] = useState(loadProfile);
  const [categories, setCategories] = useState(CATEGORIES);
  const [modal, setModal] = useState(null); // null | { expense?: object }
  const [confirm, setConfirm] = useState(null); // { title, message, confirmLabel, onConfirm }
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [toast, setToast] = useState('');
  const [signal, setSignal] = useState(0); // bump to refetch all views
  const [txPreset, setTxPreset] = useState('');
  const [mobileNav, setMobileNav] = useState(false);

  const refresh = useCallback(() => setSignal((s) => s + 1), []);

  const notify = useCallback((message) => {
    setToast(message);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    api.categories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(PROFILE_KEY, profile);
    } catch {}
  }, [profile]);

  // ---- CRUD handlers (shared by every view) ----
  const openAdd = useCallback(() => setModal({}), []);
  const openEdit = useCallback((expense) => setModal({ expense }), []);

  const askDelete = useCallback(
    (expense) => {
      setConfirm({
        title: 'Delete expense?',
        message: `“${expense.title}” will be permanently removed. This cannot be undone.`,
        confirmLabel: 'Delete',
        onConfirm: async () => {
          setConfirmBusy(true);
          try {
            await api.deleteExpense(expense._id);
            setConfirm(null);
            notify('Expense deleted');
            refresh();
          } catch (err) {
            notify(err.message);
          } finally {
            setConfirmBusy(false);
          }
        },
      });
    },
    [notify, refresh]
  );

  const askDeleteAll = useCallback(() => {
    setConfirm({
      title: 'Delete all expenses?',
      message: 'Every transaction will be permanently removed. Consider exporting a CSV backup first.',
      confirmLabel: 'Delete everything',
      onConfirm: async () => {
        setConfirmBusy(true);
        try {
          const res = await api.deleteAllExpenses();
          setConfirm(null);
          notify(`Deleted ${res.deleted} expense${res.deleted === 1 ? '' : 's'}`);
          refresh();
        } catch (err) {
          notify(err.message);
        } finally {
          setConfirmBusy(false);
        }
      },
    });
  }, [notify, refresh]);

  const selectCategory = useCallback((name) => {
    setTxPreset(name);
    setView('transactions');
  }, []);

  return (
    <div className="app">
      <Sidebar
        view={view}
        onNavigate={setView}
        profile={profile}
        open={mobileNav}
        onClose={() => setMobileNav(false)}
      />

      <main>
        <Suspense fallback={<ViewFallback />}>
        {view === 'overview' && (
          <OverviewView
            signal={signal}
            profile={profile}
            onMenu={() => setMobileNav(true)}
            onAdd={openAdd}
            onEdit={openEdit}
            onDelete={askDelete}
            onViewAll={() => setView('transactions')}
          />
        )}
        {view === 'transactions' && (
          <TransactionsView
            signal={signal}
            presetCategory={txPreset}
            onPresetConsumed={() => setTxPreset('')}
            onMenu={() => setMobileNav(true)}
            onAdd={openAdd}
            onEdit={openEdit}
            onDelete={askDelete}
            notify={notify}
          />
        )}
        {view === 'categories' && (
          <CategoriesView
            signal={signal}
            onMenu={() => setMobileNav(true)}
            onAdd={openAdd}
            onSelect={selectCategory}
          />
        )}
        {view === 'settings' && (
          <SettingsView
            signal={signal}
            profile={profile}
            onProfileChange={setProfile}
            onMenu={() => setMobileNav(true)}
            onAdd={openAdd}
            notify={notify}
            onDeleteAll={askDeleteAll}
          />
        )}
        </Suspense>
      </main>

      {modal && (
        <ExpenseModal
          expense={modal.expense}
          categories={categories}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            refresh();
          }}
          notify={notify}
        />
      )}

      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          message={confirm.message}
          confirmLabel={confirm.confirmLabel}
          busy={confirmBusy}
          onConfirm={confirm.onConfirm}
          onCancel={() => !confirmBusy && setConfirm(null)}
        />
      )}

      <Toast message={toast} />
    </div>
  );
}
