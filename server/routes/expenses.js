import { Router } from 'express';
import { expenseSchema, listQuerySchema } from '../validation.js';

export function expensesRouter(repo) {
  const router = Router();

  // GET /api/expenses?search=&category=&from=&to=&sort=&order=&page=&limit=
  router.get('/', async (req, res, next) => {
    try {
      const q = listQuerySchema.parse(req.query);
      res.json(await repo.list(q));
    } catch (err) {
      next(err);
    }
  });

  // GET /api/expenses/export.csv — CSV download honouring the same filters.
  router.get('/export.csv', async (req, res, next) => {
    try {
      const q = listQuerySchema.parse(req.query);
      const rows = await repo.all(q);
      const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const lines = ['Title,Amount (INR),Category,Date,Note'];
      for (const x of rows) {
        lines.push(
          [esc(x.title), x.amount, esc(x.category), new Date(x.date).toISOString().slice(0, 10), esc(x.note || '')].join(',')
        );
      }
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="rupeewise-expenses.csv"');
      res.send(lines.join('\n'));
    } catch (err) {
      next(err);
    }
  });

  // POST /api/expenses
  router.post('/', async (req, res, next) => {
    try {
      const data = expenseSchema.parse(req.body);
      res.status(201).json(await repo.create(data));
    } catch (err) {
      next(err);
    }
  });

  // PUT /api/expenses/:id
  router.put('/:id', async (req, res, next) => {
    try {
      const data = expenseSchema.parse(req.body);
      const row = await repo.update(req.params.id, data);
      if (!row) return res.status(404).json({ error: 'Expense not found' });
      res.json(row);
    } catch (err) {
      next(err);
    }
  });

  // DELETE /api/expenses/:id
  router.delete('/:id', async (req, res, next) => {
    try {
      const ok = await repo.remove(req.params.id);
      if (!ok) return res.status(404).json({ error: 'Expense not found' });
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  });

  // DELETE /api/expenses?confirm=all — wipe all expenses (Settings screen).
  router.delete('/', async (req, res, next) => {
    try {
      if (req.query.confirm !== 'all') {
        return res.status(400).json({ error: 'Add ?confirm=all to delete all expenses' });
      }
      const deleted = await repo.removeAll();
      res.json({ deleted });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
