import React, { useState, useEffect } from 'react';
import { Budget } from '../types';
import { CATEGORIES } from '../constants';
import { Plus, Trash2, Save, X } from 'lucide-react';

interface BudgetSettingsProps {
    budgets: Budget[];
    onSave: (budget: Budget) => void;
    onDelete: (id: string) => void;
}

export const BudgetSettings: React.FC<BudgetSettingsProps> = ({ budgets, onSave, onDelete }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newCategory, setNewCategory] = useState(CATEGORIES[0]);
    const [newAmount, setNewAmount] = useState('');

    const handleSave = () => {
        if (!newAmount) return;

        const budget: Budget = {
            id: crypto.randomUUID(),
            category: newCategory,
            amount: parseFloat(newAmount),
            period: 'monthly'
        };

        onSave(budget);
        setIsAdding(false);
        setNewAmount('');
    };

    const getBudgetForCategory = (cat: string) => budgets.find(b => b.category === cat);

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">Monthly Budgets</h2>
                    <p className="text-sm text-slate-500">Set spending limits for categories</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center space-x-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                >
                    <Plus className="w-4 h-4" />
                    <span>Add Limit</span>
                </button>
            </div>

            <div className="space-y-4">
                {isAdding && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg animate-in fade-in slide-in-from-top-2">
                        <select
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        >
                            {CATEGORIES.map(cat => (
                                <option key={cat} value={cat} disabled={!!getBudgetForCategory(cat)}>
                                    {cat}
                                </option>
                            ))}
                        </select>
                        <input
                            type="number"
                            placeholder="Amount"
                            value={newAmount}
                            onChange={(e) => setNewAmount(e.target.value)}
                            className="w-32 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                        <button onClick={handleSave} className="p-2 text-green-600 hover:bg-green-50 rounded-lg">
                            <Save className="w-4 h-4" />
                        </button>
                        <button onClick={() => setIsAdding(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {budgets.length === 0 && !isAdding && (
                    <div className="text-center py-8 text-slate-400 text-sm">
                        No budgets set. Click "Add Limit" to start.
                    </div>
                )}

                {budgets.map(budget => (
                    <div key={budget.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:border-slate-200 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-8 bg-indigo-500 rounded-full"></div>
                            <div>
                                <p className="font-medium text-slate-700">{budget.category}</p>
                                <p className="text-xs text-slate-500">Monthly Limit</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="font-bold text-slate-700">₹{budget.amount.toLocaleString()}</span>
                            <button
                                onClick={() => onDelete(budget.id)}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
