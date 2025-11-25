import { Expense, RecurringExpense } from '../types';
import { googleAuthService } from './googleAuthService';
import { googleSheetsService } from './googleSheetsService';

const DB_NAME = 'ExpenseSheetDB';
const DB_VERSION = 1;
const STORE_EXPENSES = 'expenses';
const STORE_RECURRING = 'recurring_expenses';

class DbService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        console.error("Database error:", (event.target as IDBOpenDBRequest).error);
        reject('Error opening database');
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create Expenses Store
        if (!db.objectStoreNames.contains(STORE_EXPENSES)) {
          const expenseStore = db.createObjectStore(STORE_EXPENSES, { keyPath: 'id' });
          expenseStore.createIndex('date', 'date', { unique: false });
          expenseStore.createIndex('category', 'category', { unique: false });
        }

        // Create Recurring Store
        if (!db.objectStoreNames.contains(STORE_RECURRING)) {
          db.createObjectStore(STORE_RECURRING, { keyPath: 'id' });
        }
      };
    });
  }

  private shouldUseGoogle(): boolean {
    return googleAuthService.getState().isSignedIn;
  }

  async getAllExpenses(): Promise<Expense[]> {
    if (this.shouldUseGoogle()) {
      try {
        return await googleSheetsService.getAllExpenses();
      } catch (err) {
        console.error("Google Sheets fetch failed, falling back to local", err);
        // Fallback to local if network fails? Or just throw?
        // For now, let's throw so the UI knows something is wrong
        throw err;
      }
    }
    return this._getAll<Expense>(STORE_EXPENSES);
  }

  async getAllRecurring(): Promise<RecurringExpense[]> {
    if (this.shouldUseGoogle()) {
      return await googleSheetsService.getAllRecurring();
    }
    return this._getAll<RecurringExpense>(STORE_RECURRING);
  }

  async addExpense(expense: Expense): Promise<void> {
    if (this.shouldUseGoogle()) {
      await googleSheetsService.addExpenses([expense]);
    }
    // Always save to local as backup/cache
    return this._put(STORE_EXPENSES, expense);
  }

  async addExpenses(expenses: Expense[]): Promise<void> {
    if (this.shouldUseGoogle()) {
      await googleSheetsService.addExpenses(expenses);
    }
    return this._bulkPut(STORE_EXPENSES, expenses);
  }

  async updateExpense(expense: Expense): Promise<void> {
    if (this.shouldUseGoogle()) {
      await googleSheetsService.updateExpense(expense);
    }
    return this._put(STORE_EXPENSES, expense);
  }

  async deleteExpense(id: string): Promise<void> {
    if (this.shouldUseGoogle()) {
      await googleSheetsService.deleteExpense(id);
    }
    return this._delete(STORE_EXPENSES, id);
  }

  async addRecurring(rule: RecurringExpense): Promise<void> {
    if (this.shouldUseGoogle()) {
      await googleSheetsService.addRecurring(rule);
    }
    return this._put(STORE_RECURRING, rule);
  }

  async updateRecurring(rule: RecurringExpense): Promise<void> {
    if (this.shouldUseGoogle()) {
      await googleSheetsService.updateRecurring(rule);
    }
    return this._put(STORE_RECURRING, rule);
  }

  async deleteRecurring(id: string): Promise<void> {
    if (this.shouldUseGoogle()) {
      await googleSheetsService.deleteRecurring(id);
    }
    return this._delete(STORE_RECURRING, id);
  }

  async clearAllData(): Promise<void> {
    if (this.shouldUseGoogle()) {
      await googleSheetsService.clearAllData();
    }

    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_EXPENSES, STORE_RECURRING], 'readwrite');
      transaction.objectStore(STORE_EXPENSES).clear();
      transaction.objectStore(STORE_RECURRING).clear();
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // --- Migration / Sync ---

  async syncToGoogleSheets(): Promise<void> {
    if (!this.shouldUseGoogle()) return;

    const localExpenses = await this._getAll<Expense>(STORE_EXPENSES);
    const localRecurring = await this._getAll<RecurringExpense>(STORE_RECURRING);

    if (localExpenses.length === 0 && localRecurring.length === 0) return;

    // Check if sheet is empty to avoid duplicates on initial sync
    // This is a simplified strategy: If sheet is empty, push all local.
    // If sheet has data, we might be duplicating if we just push.
    // Ideally we check IDs.

    const sheetExpenses = await googleSheetsService.getAllExpenses();
    if (sheetExpenses.length === 0) {
      if (localExpenses.length > 0) await googleSheetsService.addExpenses(localExpenses);
    } else {
      // Filter out ones that already exist
      const existingIds = new Set(sheetExpenses.map(e => e.id));
      const newToSync = localExpenses.filter(e => !existingIds.has(e.id));
      if (newToSync.length > 0) await googleSheetsService.addExpenses(newToSync);
    }

    const sheetRecurring = await googleSheetsService.getAllRecurring();
    if (sheetRecurring.length === 0) {
      for (const rule of localRecurring) {
        await googleSheetsService.addRecurring(rule);
      }
    } else {
      const existingIds = new Set(sheetRecurring.map(r => r.id));
      const newToSync = localRecurring.filter(r => !existingIds.has(r.id));
      for (const rule of newToSync) {
        await googleSheetsService.addRecurring(rule);
      }
    }
  }

  // Internal Helpers
  private async _getAll<T>(storeName: string): Promise<T[]> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async _put<T>(storeName: string, item: T): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async _bulkPut<T>(storeName: string, items: T[]): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);

      items.forEach(item => store.put(item));

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  private async _delete(storeName: string, id: string): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const dbService = new DbService();