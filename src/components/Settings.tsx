import React, { useState } from 'react';
import { Database, AlertTriangle } from 'lucide-react';
import { Expense, RecurringExpense } from '../types';


interface SettingsProps {
  expenses: Expense[];
  recurringExpenses: RecurringExpense[];
  onRestore: (expenses: Expense[], recurring: RecurringExpense[]) => void;
  onReset: () => void;
}

export const Settings: React.FC<SettingsProps> = ({
  onReset
}) => {
  const [restoreStatus, setRestoreStatus] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);

  const handleResetConfirm = () => {
    if (window.confirm('Are you sure you want to delete all data? This action cannot be undone.')) {
      onReset();
      setRestoreStatus({ msg: 'All data has been reset.', type: 'success' });
      setTimeout(() => setRestoreStatus(null), 3000);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-bold text-slate-800 mb-2">Settings</h2>
        <p className="text-slate-500 text-sm mb-6">Manage your application preferences and data.</p>

        {/* Status Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-8 flex items-start space-x-3">
          <div className="p-2 bg-blue-100 rounded-full">
            <Database className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">Cloud Storage Active</h3>
            <p className="text-xs text-slate-500 mt-1">
              Your data is securely stored in Supabase Cloud and synced across your devices.
            </p>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="mt-8 pt-8 border-t border-slate-100">
          <h3 className="text-sm font-bold text-red-600 mb-4 flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Danger Zone
          </h3>
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100">
            <div className="pr-4">
              <h4 className="text-sm font-semibold text-red-900">Reset Application</h4>
              <p className="text-xs text-red-700 mt-1">Permanently delete all expenses and settings from the cloud. This cannot be undone.</p>
            </div>
            <button
              onClick={handleResetConfirm}
              className="px-4 py-2 bg-white border border-red-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-600 hover:text-white transition-all whitespace-nowrap"
            >
              Reset All Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
