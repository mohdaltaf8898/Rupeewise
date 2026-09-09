import { Router } from 'express';
import { CATEGORIES } from '../models/Expense.js';

export function insightsRouter(repo) {
  const router = Router();

  // GET /api/categories — fixed taxonomy for dropdowns/filters.
  router.get('/categories', (_req, res) => {
    res.json(CATEGORIES);
  });

  // GET /api/stats — dashboard aggregates (totals, monthly, by-category).
  router.get('/stats', async (_req, res, next) => {
    try {
      res.json(await repo.stats());
    } catch (err) {
      next(err);
    }
  });

  return router;
}
