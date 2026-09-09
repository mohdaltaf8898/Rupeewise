import mongoose from 'mongoose';
import { Expense, CATEGORIES } from './models/Expense.js';

/**
 * Repository abstraction so the routes work identically against MongoDB
 * and the ephemeral in-memory demo store (local dev only, never production).
 */
export function createRepo({ useMemory }) {
  if (useMemory) return createMemoryRepo();
  return createMongoRepo();
}

function toStartOfDay(iso) {
  return new Date(`${iso}T00:00:00`);
}

function toEndOfDay(iso) {
  return new Date(`${iso}T23:59:59.999`);
}

function normalise(row) {
  const obj = row && typeof row.toObject === 'function' ? row.toObject() : { ...row };
  obj._id = String(obj._id);
  return obj;
}

function applyFilters(rows, q) {
  let out = rows;
  if (q.search) {
    const s = q.search.toLowerCase();
    out = out.filter((x) => `${x.title} ${x.note || ''}`.toLowerCase().includes(s));
  }
  if (q.category && q.category !== 'all') out = out.filter((x) => x.category === q.category);
  if (q.from) out = out.filter((x) => new Date(x.date) >= toStartOfDay(q.from));
  if (q.to) out = out.filter((x) => new Date(x.date) <= toEndOfDay(q.to));
  return out;
}

function applySort(rows, sort, order) {
  const dir = order === 'asc' ? 1 : -1;
  const val = (x) => (sort === 'date' || sort === 'createdAt' ? new Date(x[sort]).getTime() : x[sort]);
  return [...rows].sort((a, b) => {
    const va = val(a);
    const vb = val(b);
    if (typeof va === 'string') return va.localeCompare(vb) * dir;
    return (va - vb) * dir;
  });
}

/** Dashboard aggregates shared by both stores. */
function buildStats(rows) {
  const now = new Date();
  const inMonth = (x, offset) => {
    const d = new Date(x.date);
    const target = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    return d.getMonth() === target.getMonth() && d.getFullYear() === target.getFullYear();
  };

  const total = rows.reduce((s, x) => s + x.amount, 0);
  const thisMonthRows = rows.filter((x) => inMonth(x, 0));
  const lastMonthRows = rows.filter((x) => inMonth(x, 1));

  const byCategory = CATEGORIES.map((name) => {
    const items = rows.filter((x) => x.category === name);
    return {
      name,
      total: items.reduce((s, x) => s + x.amount, 0),
      count: items.length,
    };
  })
    .filter((c) => c.count > 0)
    .sort((a, b) => b.total - a.total)
    .map((c) => ({ ...c, percent: total ? Math.round((c.total / total) * 100) : 0 }));

  const monthly = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const items = rows.filter((x) => {
      const q = new Date(x.date);
      return q.getMonth() === d.getMonth() && q.getFullYear() === d.getFullYear();
    });
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleString('en', { month: 'short' }),
      total: items.reduce((s, x) => s + x.amount, 0),
      count: items.length,
    };
  });

  return {
    total,
    count: rows.length,
    avg: rows.length ? total / rows.length : 0,
    thisMonth: {
      total: thisMonthRows.reduce((s, x) => s + x.amount, 0),
      count: thisMonthRows.length,
    },
    lastMonth: {
      total: lastMonthRows.reduce((s, x) => s + x.amount, 0),
      count: lastMonthRows.length,
    },
    byCategory,
    monthly,
  };
}

function createMemoryRepo() {
  let rows = [];

  return {
    mode: 'memory',
    async count() {
      return rows.length;
    },
    async list(q) {
      const filtered = applySort(applyFilters(rows, q), q.sort, q.order);
      const total = filtered.length;
      const pages = Math.max(1, Math.ceil(total / q.limit));
      const page = Math.min(q.page, pages);
      const start = (page - 1) * q.limit;
      return { data: filtered.slice(start, start + q.limit).map(normalise), total, page, pages, limit: q.limit };
    },
    async all(q = {}) {
      return applySort(applyFilters(rows, q), q.sort || 'date', q.order || 'desc').map(normalise);
    },
    async create(data) {
      const row = { ...data, _id: `mem_${Date.now()}_${Math.random().toString(36).slice(2)}`, createdAt: new Date(), updatedAt: new Date() };
      rows.push(row);
      return normalise(row);
    },
    async update(id, data) {
      const i = rows.findIndex((x) => String(x._id) === String(id));
      if (i < 0) return null;
      rows[i] = { ...rows[i], ...data, updatedAt: new Date() };
      return normalise(rows[i]);
    },
    async remove(id) {
      const before = rows.length;
      rows = rows.filter((x) => String(x._id) !== String(id));
      return rows.length !== before;
    },
    async removeAll() {
      const n = rows.length;
      rows = [];
      return n;
    },
    async stats() {
      return buildStats(rows.map(normalise));
    },
  };
}

function createMongoRepo() {
  const toQuery = (q) => {
    const query = {};
    if (q.search) {
      query.$or = [
        { title: { $regex: q.search, $options: 'i' } },
        { note: { $regex: q.search, $options: 'i' } },
      ];
    }
    if (q.category && q.category !== 'all') query.category = q.category;
    if (q.from || q.to) {
      query.date = {
        ...(q.from ? { $gte: toStartOfDay(q.from) } : {}),
        ...(q.to ? { $lte: toEndOfDay(q.to) } : {}),
      };
    }
    return query;
  };

  return {
    mode: 'mongodb',
    async count() {
      return Expense.countDocuments();
    },
    async list(q) {
      const query = toQuery(q);
      const total = await Expense.countDocuments(query);
      const pages = Math.max(1, Math.ceil(total / q.limit));
      const page = Math.min(q.page, pages);
      const data = await Expense.find(query)
        .sort({ [q.sort]: q.order === 'asc' ? 1 : -1 })
        .skip((page - 1) * q.limit)
        .limit(q.limit)
        .lean();
      return { data: data.map(normalise), total, page, pages, limit: q.limit };
    },
    async all(q = {}) {
      const data = await Expense.find(toQuery(q))
        .sort({ [q.sort || 'date']: q.order === 'asc' ? 1 : -1 })
        .lean();
      return data.map(normalise);
    },
    async create(data) {
      return normalise(await Expense.create(data));
    },
    async update(id, data) {
      if (!mongoose.isValidObjectId(id)) return null;
      const row = await Expense.findByIdAndUpdate(id, data, { new: true, runValidators: true }).lean();
      return row ? normalise(row) : null;
    },
    async remove(id) {
      if (!mongoose.isValidObjectId(id)) return false;
      return Boolean(await Expense.findByIdAndDelete(id));
    },
    async removeAll() {
      const res = await Expense.deleteMany({});
      return res.deletedCount || 0;
    },
    async stats() {
      const rows = await Expense.find({}).lean();
      return buildStats(rows.map(normalise));
    },
  };
}
