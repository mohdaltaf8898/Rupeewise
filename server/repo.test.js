import test from 'node:test';
import assert from 'node:assert/strict';
import { createRepo } from './repo.js';

const baseQuery = { search: '', category: 'all', from: '', to: '', sort: 'date', order: 'desc', page: 1, limit: 20 };

async function seed(repo) {
  const today = new Date().toISOString().slice(0, 10);
  await repo.create({ title: 'Lunch', amount: 200, category: 'Food & Dining', date: today, note: '' });
  await repo.create({ title: 'Metro', amount: 60, category: 'Transport', date: today, note: 'Office' });
  await repo.create({ title: 'Movie', amount: 500, category: 'Entertainment', date: '2020-01-15', note: '' });
}

test('memory repo: CRUD lifecycle', async () => {
  const repo = createRepo({ useMemory: true });
  const created = await repo.create({ title: 'Test', amount: 99, category: 'Other', date: '2026-09-01', note: '' });
  assert.ok(created._id);

  const updated = await repo.update(created._id, { title: 'Renamed', amount: 150, category: 'Other', date: '2026-09-02', note: '' });
  assert.equal(updated.title, 'Renamed');

  assert.equal(await repo.remove(created._id), true);
  assert.equal(await repo.remove(created._id), false);
  assert.equal(await repo.update(created._id, { title: 'x', amount: 1, category: 'Other', date: '2026-09-01' }), null);
});

test('memory repo: search, filter, sort, paginate', async () => {
  const repo = createRepo({ useMemory: true });
  await seed(repo);

  assert.equal((await repo.list({ ...baseQuery, search: 'office' })).total, 1);
  assert.equal((await repo.list({ ...baseQuery, category: 'Transport' })).total, 1);
  assert.equal((await repo.list({ ...baseQuery, from: '2026-01-01' })).total, 2);
  assert.equal((await repo.list({ ...baseQuery, to: '2021-01-01' })).total, 1);

  const byAmount = await repo.list({ ...baseQuery, sort: 'amount', order: 'asc' });
  assert.deepEqual(byAmount.data.map((x) => x.amount), [60, 200, 500]);

  const paged = await repo.list({ ...baseQuery, limit: 2, page: 2 });
  assert.equal(paged.total, 3);
  assert.equal(paged.data.length, 1);
});

test('memory repo: stats aggregate correctly', async () => {
  const repo = createRepo({ useMemory: true });
  await seed(repo);
  const stats = await repo.stats();
  assert.equal(stats.total, 760);
  assert.equal(stats.count, 3);
  assert.equal(stats.thisMonth.count, 2);
  assert.equal(stats.byCategory[0].name, 'Entertainment');
  assert.equal(stats.monthly.length, 6);
});

test('memory repo: removeAll clears everything', async () => {
  const repo = createRepo({ useMemory: true });
  await seed(repo);
  assert.equal(await repo.removeAll(), 3);
  assert.equal(await repo.count(), 0);
});
