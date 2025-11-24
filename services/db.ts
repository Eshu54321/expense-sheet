import { Expense, RecurringExpense } from '../src/types';

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

  async getAllExpenses(): Promise<Expense[]> {
    return this._getAll<Expense>(STORE_EXPENSES);
  }

  async getAllRecurring(): Promise<RecurringExpense[]> {
    return this._getAll<RecurringExpense>(STORE_RECURRING);
  }

  async addExpense(expense: Expense): Promise<void> {
    return this._put(STORE_EXPENSES, expense);
  }

  async addExpenses(expenses: Expense[]): Promise<void> {
    return this._bulkPut(STORE_EXPENSES, expenses);
  }

  async updateExpense(expense: Expense): Promise<void> {
    return this._put(STORE_EXPENSES, expense);
  }

  async deleteExpense(id: string): Promise<void> {
    return this._delete(STORE_EXPENSES, id);
  }

  async addRecurring(rule: RecurringExpense): Promise<void> {
    return this._put(STORE_RECURRING, rule);
  }

  async updateRecurring(rule: RecurringExpense): Promise<void> {
    return this._put(STORE_RECURRING, rule);
  }

  async deleteRecurring(id: string): Promise<void> {
    return this._delete(STORE_RECURRING, id);
  }
  
  async clearAllData(): Promise<void> {
      if (!this.db) await this.init();
      return new Promise((resolve, reject) => {
          const transaction = this.db!.transaction([STORE_EXPENSES, STORE_RECURRING], 'readwrite');
          transaction.objectStore(STORE_EXPENSES).clear();
          transaction.objectStore(STORE_RECURRING).clear();
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error);
      });
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