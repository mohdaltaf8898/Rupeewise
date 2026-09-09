import { z } from 'zod';
import { CATEGORIES } from './models/Expense.js';

// Shared validation for POST / PUT bodies. Also unit-tested (see validation.test.js).
export const expenseSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(80, 'Title is too long'),
  amount: z.coerce
    .number({ invalid_type_error: 'Amount must be a number' })
    .positive('Amount must be greater than zero')
    .max(100000000, 'Amount is too large'),
  category: z.enum(CATEGORIES, { errorMap: () => ({ message: 'Invalid category' }) }),
  date: z.coerce.date({ invalid_type_error: 'Invalid date' }),
  note: z.string().trim().max(240, 'Note is too long').optional().default(''),
});

export const listQuerySchema = z.object({
  search: z.string().trim().max(80).optional().default(''),
  category: z.string().trim().optional().default('all'),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  sort: z.enum(['date', 'amount', 'title', 'createdAt']).optional().default('date'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
  page: z.coerce.number().int().min(1).max(10000).optional().default(1),
  limit: z.coerce.number().int().min(1).max(200).optional().default(20),
});
