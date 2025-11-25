import React from 'react';
import { Expense, RecurringExpense, Budget } from '../types';
import { Download, RefreshCw, Trash2, Database, AlertTriangle } from 'lucide-react';
import { BudgetSettings } from './BudgetSettings';
import { exportToCSV } from '../utils/exportUtils';
import { MigrationTool } from './MigrationTool';

interface SettingsProps {
  expenses: Expense[];
  recurringExpenses: RecurringExpense[];
  budgets: Budget[];
  onRestore: (expenses: Expense[], recurring: RecurringExpense[]) => void;
  onReset: () => void;
  onSaveBudget: (budget: Budget) => void;
  onDeleteBudget: (id: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({
  expenses,
  recurringExpenses,
  budgets,
  onRestore,
  onReset,
  onSaveBudget,
  onDeleteBudget
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = {
      expenses,
      recurringExpenses,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expense-sheet-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    exportToCSV(expenses);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        if (data.expenses && Array.isArray(data.expenses)) {
          onRestore(data.expenses, data.recurringExpenses || []);
          alert('Data restored successfully!');
        } else {
          alert('Invalid backup file format');
        }
      } catch (error) {
        alert('Failed to parse backup file');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-12">

      {/* Migration Tool (Only shows if local data exists) */}
      <MigrationTool />

      {/* Budget Settings Section */}
      <section>
        <BudgetSettings
          budgets={budgets}
          onSave={onSaveBudget}
          onDelete={onDeleteBudget}
        />
      </section>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 flex items-center">
            <Database className="w-5 h-5 mr-2 text-slate-500" />
            Data Management
          </h2>
          <p className="text-sm text-slate-500 mt-1">Manage your local data and backups</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Storage Status */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Database className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-slate-700">Storage Status</p>
                <p className="text-xs text-slate-500">Supabase Cloud</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-xs font-medium text-green-600">Active</span>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleExportCSV}
              className="flex items-center justify-center space-x-2 p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors group"
            >
              <Download className="w-5 h-5 text-green-600 group-hover:text-green-700" />
              <span className="font-medium text-slate-600 group-hover:text-slate-800">Export CSV</span>
            </button>

            <button
              onClick={handleExport}
              className="flex items-center justify-center space-x-2 p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors group"
            >
              <Download className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
              <span className="font-medium text-slate-600 group-hover:text-slate-800">Backup JSON</span>
            </button>

            <button
              onClick={handleImportClick}
              className="flex items-center justify-center space-x-2 p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors group"
            >
              <RefreshCw className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
              <span className="font-medium text-slate-600 group-hover:text-slate-800">Restore Backup</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
          </div>

          {/* Danger Zone */}
          <div className="pt-6 border-t border-slate-100">
            <h3 className="text-sm font-bold text-red-600 mb-4 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Danger Zone
            </h3>
            <button
              onClick={onReset}
              className="w-full flex items-center justify-center space-x-2 p-4 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-colors text-red-600"
            >
              <Trash2 className="w-5 h-5" />
              <span className="font-medium">Reset Application</span>
            </button>
            <p className="text-xs text-center text-red-400 mt-2">
              This will permanently delete all your data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
