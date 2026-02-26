import Dexie, { Table } from 'dexie';

export interface OfflineMutation {
    id?: number;
    type: 'ADD_EXPENSE' | 'UPDATE_EXPENSE' | 'DELETE_EXPENSE' | 'ADD_RECURRING' | 'UPDATE_RECURRING' | 'DELETE_RECURRING' | 'UPSERT_BUDGET' | 'DELETE_BUDGET' | 'ADD_LENDER' | 'DELETE_LENDER' | 'ADD_LOAN_TRANS' | 'DELETE_LOAN_TRANS';
    payload: any;
    timestamp: number;
}

export class ExpenseSheetDB extends Dexie {
    mutations!: Table<OfflineMutation, number>;

    constructor() {
        super('ExpenseSheetDB');
        this.version(1).stores({
            mutations: '++id, type, timestamp'
        });
    }
}

export const db = new ExpenseSheetDB();
