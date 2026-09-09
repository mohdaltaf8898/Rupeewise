import mongoose from 'mongoose';

// Fixed category taxonomy shared by the API and (via /api/categories) the client.
export const CATEGORIES = [
  'Food & Dining',
  'Transport',
  'Shopping',
  'Bills & Utilities',
  'Entertainment',
  'Health',
  'Education',
  'Travel',
  'Other',
];

const expenseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 80 },
    amount: { type: Number, required: true, min: 0.01, max: 100000000 },
    category: { type: String, required: true, enum: CATEGORIES },
    date: { type: Date, required: true },
    note: { type: String, trim: true, maxlength: 240, default: '' },
  },
  { timestamps: true }
);

expenseSchema.index({ date: -1 });
expenseSchema.index({ category: 1, date: -1 });

export const Expense = mongoose.model('Expense', expenseSchema);
