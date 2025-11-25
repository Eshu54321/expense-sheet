export enum Category {
  FOOD = 'Food & Dining',
  TRANSPORT = 'Transportation',
  HOUSING = 'Housing & Utilities',
  ENTERTAINMENT = 'Entertainment',
  SHOPPING = 'Shopping',
  HEALTH = 'Health & Wellness',
  INCOME = 'Income',
  OTHER = 'Miscellaneous'
}

export interface Expense {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  category: Category | string;
  amount: number;
  paymentMethod: string;
}

export interface ExpenseSummary {
  total: number;
  income: number;
  balance: number;
  count: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

export interface FilterConfig {
  search: string;
  category: string;
  paymentMethod: string;
  startDate: string;
  endDate: string;
  type: 'all' | 'income' | 'expense';
  minAmount: string;
  maxAmount: string;
}

export type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurringExpense {
  id: string;
  description: string;
  amount: number;
  category: Category | string;
  frequency: Frequency;
  nextDueDate: string; // YYYY-MM-DD
  active: boolean;
}

export interface Budget {
  id: string;
  category: string;
  amount: number;
  period: 'monthly';
}

// --- Google Sheets Integration Types ---

export interface GoogleUser {
  id: string;
  name: string;
  email: string;
  imageUrl: string;
}

export interface GoogleAuthState {
  isSignedIn: boolean;
  user: GoogleUser | null;
  isInitialized: boolean;
  error: string | null;
}

export interface SyncStatus {
  lastSync: string | null; // ISO string
  isSyncing: boolean;
  pendingChanges: number;
  error: string | null;
}

export interface SheetMetadata {
  spreadsheetId: string;
  spreadsheetUrl: string;
  expenseSheetId: number;
  recurringSheetId: number;
}