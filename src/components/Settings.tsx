import React, { useRef, useState } from 'react';
import { Download, Upload, Trash2, Database, CheckCircle, AlertTriangle, RefreshCw, FileJson } from 'lucide-react';
import { Expense, RecurringExpense } from '../types';

interface SettingsProps {
  expenses: Expense[];
  recurringExpenses: RecurringExpense[];
  onRestore: (expenses: Expense[], recurring: RecurringExpense[]) => void;
  onReset: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ 
  expenses, 
  recurringExpenses, 
  onRestore, 
  onReset 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [restoreStatus, setRestoreStatus] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  const handleBackup = () => {
    const data = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      expenses,
      recurringExpenses
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `expenses_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        
        // Basic validation
        if (Array.isArray(json.expenses) && Array.isArray(json.recurringExpenses)) {
          onRestore(json.expenses, json.recurringExpenses);
          setRestoreStatus({ msg: 'Data restored successfully!', type: 'success' });
          setTimeout(() => setRestoreStatus(null), 3000);
        } else {
          throw new Error('Invalid file format');
        }
      } catch (err) {
        setRestoreStatus({ msg: 'Failed to parse backup file.', type: 'error' });
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be selected again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

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
        <h2 className="text-lg font-bold text-slate-800 mb-2">Data Management</h2>
        <p className="text-slate-500 text-sm mb-6">Manage your local data, create backups, or restore from a previous file.</p>

        {/* Status Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-8 flex items-start space-x-3">
            <div className="p-2 bg-green-100 rounded-full">
                <Database className="w-5 h-5 text-green-600" />
            </div>
            <div>
                <h3 className="font-semibold text-slate-800 text-sm">IndexedDB Active</h3>
                <p className="text-xs text-slate-500 mt-1">
                    Your data is stored securely in the browser's IndexedDB database. 
                    This is more reliable than standard local storage. However, clearing browser data will still remove it.
                </p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Backup Section */}
            <div className="border border-slate-200 rounded-xl p-5 hover:border-blue-300 transition-colors group">
                <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                        <Download className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-800">Backup Data</h3>
                        <p className="text-xs text-slate-500">Download a JSON file</p>
                    </div>
                </div>
                <p className="text-sm text-slate-600 mb-4">
                    Export all your expenses and recurring rules to a secure JSON file. Keep this file safe to restore your data later.
                </p>
                <button 
                    onClick={handleBackup}
                    className="w-full py-2.5 px-4 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition-all flex items-center justify-center space-x-2"
                >
                    <FileJson className="w-4 h-4" />
                    <span>Download Backup</span>
                </button>
            </div>

            {/* Restore Section */}
            <div className="border border-slate-200 rounded-xl p-5 hover:border-green-300 transition-colors group">
                <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-green-50 text-green-600 rounded-lg group-hover:bg-green-100 transition-colors">
                        <Upload className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-800">Restore Data</h3>
                        <p className="text-xs text-slate-500">Import from JSON file</p>
                    </div>
                </div>
                <p className="text-sm text-slate-600 mb-4">
                    Restore your data from a previously downloaded backup file. <span className="text-red-500 font-medium">Warning: This will replace current data.</span>
                </p>
                
                <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".json"
                    className="hidden" 
                />
                
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2.5 px-4 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-all flex items-center justify-center space-x-2"
                >
                    <RefreshCw className="w-4 h-4" />
                    <span>Select File to Restore</span>
                </button>
            </div>
        </div>

        {/* Restore Feedback */}
        {restoreStatus && (
             <div className={`mt-6 p-3 rounded-lg flex items-center space-x-2 text-sm ${restoreStatus.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {restoreStatus.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                <span>{restoreStatus.msg}</span>
             </div>
        )}

        {/* Danger Zone */}
        <div className="mt-12 pt-8 border-t border-slate-100">
            <h3 className="text-sm font-bold text-red-600 mb-4 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Danger Zone
            </h3>
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100">
                <div className="pr-4">
                    <h4 className="text-sm font-semibold text-red-900">Reset Application</h4>
                    <p className="text-xs text-red-700 mt-1">Permanently delete all expenses and settings. This cannot be undone.</p>
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
