/**
 * Seed the database with realistic demo expenses (INR).
 *
 *   MONGODB_URI=mongodb://127.0.0.1:27017/rupeewise npm run seed
 *   npm run seed -- --clear     # wipe existing expenses first
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { Expense } from './models/Expense.js';

const SAMPLES = [
  ['Swiggy dinner order', 349, 'Food & Dining', 'Weekend biryani'],
  ['Domino\u2019s pizza night', 599, 'Food & Dining', ''],
  ['Cafe coffee with friends', 240, 'Food & Dining', 'Third Wave'],
  ['Groceries \u2014 BigBasket', 1849, 'Food & Dining', 'Monthly stock-up'],
  ['Office lunch', 180, 'Food & Dining', ''],
  ['Uber to airport', 640, 'Transport', 'IndiGo T1'],
  ['Metro card recharge', 500, 'Transport', ''],
  ['Petrol \u2014 HP pump', 2000, 'Transport', 'Full tank'],
  ['Ola cab to office', 220, 'Transport', ''],
  ['Myntra kurta', 1299, 'Shopping', 'Sale purchase'],
  ['Amazon \u2014 headphones', 2499, 'Shopping', 'boAt Airdopes'],
  ['Decathlon shoes', 1799, 'Shopping', 'Running'],
  ['Electricity bill', 1420, 'Bills & Utilities', 'BESCOM'],
  ['Jio prepaid recharge', 399, 'Bills & Utilities', '84 days'],
  ['Broadband \u2014 Airtel', 799, 'Bills & Utilities', 'Fiber'],
  ['Gas cylinder refill', 1103, 'Bills & Utilities', 'Indane'],
  ['PVR movie tickets', 750, 'Entertainment', '2 tickets'],
  ['Spotify Premium', 119, 'Entertainment', 'Monthly'],
  ['Netflix subscription', 199, 'Entertainment', 'Mobile plan'],
  ['Pharmacy \u2014 Apollo', 560, 'Health', 'Vitamins'],
  ['Dental checkup', 800, 'Health', 'Clove Dental'],
  ['Gym membership', 2500, 'Health', 'Quarterly'],
  ['Udemy course', 499, 'Education', 'React advanced'],
  ['Book \u2014 Crossword', 450, 'Education', 'Atomic Habits'],
  ['Flight to Goa', 5490, 'Travel', 'IndiGo return'],
  ['Hotel \u2014 2 nights', 6800, 'Travel', 'Baga beach'],
  ['Cab + food in Goa', 2150, 'Travel', ''],
  ['Gift for Diwali', 1100, 'Other', 'Dry fruits box'],
  ['Haircut', 350, 'Other', 'Looks salon'],
];

function randomDate(monthsBack) {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
  const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(1 + Math.floor(Math.random() * daysInMonth));
  return d;
}

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is required to seed.');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI);

  if (process.argv.includes('--clear')) {
    await Expense.deleteMany({});
    console.log('Cleared existing expenses.');
  }

  // Spread samples across the last 6 months, weighted toward recent months.
  const docs = [];
  for (let m = 0; m < 6; m += 1) {
    const count = m === 0 ? 12 : 5 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i += 1) {
      const [title, base, category, note] = SAMPLES[Math.floor(Math.random() * SAMPLES.length)];
      const jitter = 0.7 + Math.random() * 0.8;
      docs.push({
        title,
        amount: Math.max(10, Math.round(base * jitter)),
        category,
        date: randomDate(m),
        note,
      });
    }
  }

  await Expense.insertMany(docs);
  console.log(`Seeded ${docs.length} demo expenses.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
