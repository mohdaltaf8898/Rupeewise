import test from 'node:test';
import assert from 'node:assert/strict';
import { expenseSchema, listQuerySchema } from './validation.js';

test('accepts a valid expense payload', () => {
  const parsed = expenseSchema.parse({
    title: 'Dinner',
    amount: '450',
    category: 'Food & Dining',
    date: '2026-09-01',
    note: 'Swiggy',
  });
  assert.equal(parsed.title, 'Dinner');
  assert.equal(parsed.amount, 450);
  assert.ok(parsed.date instanceof Date);
});

test('rejects missing title and bad amount', () => {
  assert.throws(() => expenseSchema.parse({ title: '', amount: 100, category: 'Other', date: '2026-09-01' }));
  assert.throws(() => expenseSchema.parse({ title: 'x', amount: 0, category: 'Other', date: '2026-09-01' }));
  assert.throws(() => expenseSchema.parse({ title: 'x', amount: -5, category: 'Other', date: '2026-09-01' }));
});

test('rejects unknown category and oversized note', () => {
  assert.throws(() => expenseSchema.parse({ title: 'x', amount: 10, category: 'Gambling', date: '2026-09-01' }));
  assert.throws(() =>
    expenseSchema.parse({ title: 'x', amount: 10, category: 'Other', date: '2026-09-01', note: 'n'.repeat(241) })
  );
});

test('list query gets safe defaults', () => {
  const q = listQuerySchema.parse({});
  assert.equal(q.page, 1);
  assert.equal(q.limit, 20);
  assert.equal(q.sort, 'date');
  assert.equal(q.order, 'desc');
});
