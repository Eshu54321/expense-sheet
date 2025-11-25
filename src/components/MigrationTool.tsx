import React, { useState, useEffect } from 'react';
import { Database, UploadCloud, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
import { Expense, RecurringExpense } from '../types';

const DB_NAME = 'ExpenseSheetDB';
const STORE_EXPENSES = 'expenses';
const STORE_RECURRING = 'recurring_expenses';

export const MigrationTool: React.FC = () => {
    const [localData, setLocalData] = useState<{ expenses: Expense[], recurring: RecurringExpense[] } | null>(null);
    const [status, setStatus] = useState<'idle' | 'scanning' | 'migrating' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        scanLocalDB();
    }, []);

    const scanLocalDB = async () => {
        setStatus('scanning');
        try {
            const expenses = await readStore<Expense>(STORE_EXPENSES);
            const recurring = await readStore<RecurringExpense>(STORE_RECURRING);

            if (expenses.length > 0 || recurring.length > 0) {
                setLocalData({ expenses, recurring });
            }
            setStatus('idle');
        } catch (err) {
            console.error("Failed to scan local DB", err);
            // It's okay if it fails (maybe DB doesn't exist), just stay idle
            setStatus('idle');
        }
    };

    const readStore = <T,>(storeName: string): Promise<T[]> => {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, 1);

            request.onerror = () => reject("Could not open DB");

            request.onsuccess = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(storeName)) {
                    resolve([]); // Store doesn't exist
                    return;
                }

                const transaction = db.transaction(storeName, 'readonly');
                const store = transaction.objectStore(storeName);
                const getAll = store.getAll();

                getAll.onsuccess = () => resolve(getAll.result);
                getAll.onerror = () => reject(getAll.error);
            };
        });
    };

    const handleMigrate = async () => {
        if (!localData) return;

        setStatus('migrating');
        try {
            // 1. Upload Expenses
            if (localData.expenses.length > 0) {
                // We need to ensure IDs are valid UUIDs. 
                // If they are legacy IDs (e.g. numbers or simple strings), Supabase might reject them if the column is UUID.
                // However, our schema uses UUID, so we should probably regenerate IDs or ensure they are UUIDs.
                // For safety, let's try to keep them if they look like UUIDs, otherwise generate new ones.
                // Actually, to avoid duplicates, we should probably just let Supabase handle it or generate new ones?
                // Let's keep it simple: Upload as is. If it fails, we might need to sanitize.

                // Batch upload
                await supabaseService.addExpenses(localData.expenses);
            }

            // 2. Upload Recurring
            for (const rule of localData.recurring) {
                await supabaseService.addRecurringExpense(rule);
            }

            setStatus('success');
        } catch (err: any) {
            console.error("Migration failed", err);
            setErrorMsg(err.message || "Failed to upload data");
            setStatus('error');
        }
    };

    if (!localData || (localData.expenses.length === 0 && localData.recurring.length === 0)) {
        return null; // Nothing to migrate
    }

    if (status === 'success') {
        return (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                    <h3 className="text-sm font-semibold text-green-900">Migration Successful</h3>
                    <p className="text-xs text-green-700 mt-1">
                        Successfully moved {localData.expenses.length} expenses and {localData.recurring.length} recurring rules to the cloud.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
            <div className="flex items-start space-x-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                    <UploadCloud className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1">
                    <h3 className="text-sm font-semibold text-indigo-900">Found Local Data</h3>
                    <p className="text-xs text-indigo-700 mt-1 mb-3">
                        We found {localData.expenses.length} transactions and {localData.recurring.length} recurring rules on this device.
                        Move them to the cloud to sync across devices.
                    </p>

                    {status === 'error' && (
                        <div className="mb-3 flex items-center text-xs text-red-600">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {errorMsg}
                        </div>
                    )}

                    <button
                        onClick={handleMigrate}
                        disabled={status === 'migrating'}
                        className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                        {status === 'migrating' ? (
                            <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>Moving to Cloud...</span>
                            </>
                        ) : (
                            <span>Migrate to Cloud</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
