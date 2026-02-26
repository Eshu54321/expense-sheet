import React, { useState } from 'react';
import { Expense } from '../types';
import { X, Check, Edit2, Trash2, Plus } from 'lucide-react';

interface ReviewParsedExpensesModalProps {
    expenses: Omit<Expense, 'id'>[];
    imagePreviewUrl?: string | null;
    onConfirm: (expenses: Omit<Expense, 'id'>[]) => void;
    onCancel: () => void;
}

export const ReviewParsedExpensesModal: React.FC<ReviewParsedExpensesModalProps> = ({ expenses: initialExpenses, imagePreviewUrl, onConfirm, onCancel }) => {
    const [expenses, setExpenses] = useState<Omit<Expense, 'id'>[]>(initialExpenses);

    const handleAmountChange = (index: number, value: string) => {
        const newExpenses = [...expenses];
        newExpenses[index] = { ...newExpenses[index], amount: Number(value) || 0 };
        setExpenses(newExpenses);
    };

    const handleDescChange = (index: number, value: string) => {
        const newExpenses = [...expenses];
        newExpenses[index] = { ...newExpenses[index], description: value };
        setExpenses(newExpenses);
    };

    const handleDelete = (index: number) => {
        setExpenses(expenses.filter((_, i) => i !== index));
    };

    const handleAddBlank = () => {
        setExpenses([
            ...expenses,
            { description: 'New Item', amount: 0, category: 'Other', date: new Date().toISOString().split('T')[0], paymentMethod: 'Cash' }
        ]);
    };

    const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-6 shadow-2xl">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700">
                {/* Header */}
                <div className="flex justify-between items-center p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Review Scanned Items</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Please verify the AI extracted details before saving.</p>
                    </div>
                    <button onClick={onCancel} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto flex flex-col md:flex-row min-h-0">

                    {/* Image Preview (Left Side on Desktop) */}
                    {imagePreviewUrl && (
                        <div className="md:w-1/3 border-r border-slate-100 dark:border-slate-800 bg-black/5 dark:bg-black/20 p-4 flex flex-col items-center justify-start overflow-y-auto">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider w-full mb-3">Original Image</p>
                            <img
                                src={imagePreviewUrl}
                                alt="Scanned Receipt Preview"
                                className="w-full max-w-sm rounded-lg shadow-md border border-slate-200 dark:border-slate-700 object-contain"
                            />
                        </div>
                    )}

                    {/* Extracted Data (Right Side on Desktop) */}
                    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
                        <div className="flex justify-between items-end mb-4">
                            <p className="text-xs font-semibold px-2 text-slate-500 uppercase tracking-wider">Extracted Items ({expenses.length})</p>
                            <button onClick={handleAddBlank} className="text-xs flex items-center text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
                                <Plus className="w-3 h-3 mr-1" /> Add Missing Item
                            </button>
                        </div>

                        <div className="space-y-3">
                            {expenses.length === 0 ? (
                                <div className="text-center py-8 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                                    No items found. You can add them manually.
                                </div>
                            ) : (
                                expenses.map((expense, i) => (
                                    <div key={i} className="flex flex-col sm:flex-row gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors group">

                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                value={expense.description}
                                                onChange={(e) => handleDescChange(i, e.target.value)}
                                                className="w-full bg-transparent font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 rounded px-1 -ml-1"
                                                placeholder="Item Name"
                                            />
                                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">{expense.category}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
                                                <input
                                                    type="number"
                                                    value={expense.amount || ''}
                                                    onChange={(e) => handleAmountChange(i, e.target.value)}
                                                    className="w-24 pl-6 pr-2 py-1.5 font-bold text-right bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white"
                                                />
                                            </div>
                                            <button
                                                onClick={() => handleDelete(i)}
                                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                                title="Remove Item"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-slate-100 dark:border-slate-800 p-4 sm:p-6 bg-slate-50 dark:bg-slate-900/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="text-center sm:text-left w-full sm:w-auto">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Total Extracted Amount</p>
                        <p className="text-2xl font-bold text-slate-800 dark:text-white">₹{totalAmount.toLocaleString()}</p>
                    </div>

                    <div className="flex w-full sm:w-auto gap-3">
                        <button
                            onClick={onCancel}
                            className="flex-1 sm:flex-none px-6 py-2.5 font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                            Discard
                        </button>
                        <button
                            onClick={() => onConfirm(expenses)}
                            disabled={expenses.length === 0}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 font-medium text-white bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] rounded-xl transition-all shadow-md shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Check className="w-5 h-5" />
                            Save {expenses.length} Items
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};
