// Shared category taxonomy, icons and chart palette (mirrors the API).
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

export const CATEGORY_ICONS = {
  'Food & Dining': '🍜',
  Transport: '🚕',
  Shopping: '🛍️',
  'Bills & Utilities': '💡',
  Entertainment: '🎬',
  Health: '✚',
  Education: '📚',
  Travel: '✈️',
  Other: '•••',
};

export const CHART_COLORS = [
  '#6d5dfc',
  '#ff8b6a',
  '#36b795',
  '#f7b84b',
  '#eb6f92',
  '#4b9cf5',
  '#a56de2',
  '#34a4ae',
  '#94a3b8',
];

export const VIEWS = [
  { id: 'overview', label: 'Overview', icon: '▦' },
  { id: 'transactions', label: 'Transactions', icon: '↗' },
  { id: 'categories', label: 'Categories', icon: '◫' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
];

export function colorFor(category) {
  const i = CATEGORIES.indexOf(category);
  return CHART_COLORS[i < 0 ? CHART_COLORS.length - 1 : i];
}
