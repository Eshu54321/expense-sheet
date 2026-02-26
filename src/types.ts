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

// --- Multi-User Profiles ---
export interface Profile {
  id: string;
  name: string;
  avatar?: string;
  color?: string; // Hex color for UI charts
  isDefault?: boolean;
}

export interface Expense {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  category: Category | string;
  amount: number;
  paymentMethod: string;
  profileId?: string; // Optional for backward compatibility, required for multi-user
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
  profileId?: string; // Add filter for profile
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
  profileId?: string; // Tie rules to profiles
}

export interface Budget {
  id: string;
  category: string;
  amount: number;
  period: 'monthly';
  profileId?: string; // Budgets can be personal or shared (null)
}

export interface Lender {
  id: string;
  name: string;
  contactInfo?: string;
  totalBorrowed: number;
  totalRepaid: number;
  currentBalance: number; // Positive means you owe them
  interestRate?: number;
  emiAmount?: number;
  loanType?: string;
  startDate?: string;
}

export interface LoanTransaction {
  id: string;
  lenderId: string;
  date: string; // YYYY-MM-DD
  type: 'borrow' | 'repay';
  amount: number;
  description: string;
}

// --- Asset Tracking Types ---

export interface Asset {
  id: string;
  name: string;
  type: 'bank' | 'investment' | 'real_estate' | 'crypto' | 'vehicle' | 'other';
  currentValue: number;
  purchaseValue?: number;
  purchaseDate?: string;
  notes?: string;
  lastUpdated: string; // ISO string
  profileId?: string; // Track who owns the asset
}

export interface AssetTransaction {
  id: string;
  assetId: string;
  date: string; // YYYY-MM-DD
  type: 'deposit' | 'withdrawal' | 'appreciation' | 'depreciation';
  amount: number;
  description?: string;
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
  recurringSheetId: number;
}

export interface ItemRate {
  id: string;
  name: string;
  rate: number;
  unit: string | null;
  lastUpdated: string; // ISO string
}

export interface PriceHistory {
  id: string;
  name: string;
  rate: number;
  unit: string | null;
  date: string; // YYYY-MM-DD
}