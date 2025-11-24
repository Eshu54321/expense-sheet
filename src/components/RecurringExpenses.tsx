import React, { useState } from 'react';
import { Plus, Trash2, Calendar, RefreshCw, CheckCircle2, Circle } from 'lucide-react';
import { RecurringExpense, Category, Frequency } from '../types';
import { COLORS } from '../constants';

interface RecurringExpensesProps {
  recurringExpenses: RecurringExpense[];
  onAdd: (expense: Omit<RecurringExpense, 'id'>) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string) => void;
}

export const RecurringExpenses: React.FC<RecurringExpensesProps> = ({
  recurringExpenses,
  onAdd,
  onDelete,
  onToggleActive
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newExpense, setNewExpense] = useState<Partial<RecurringExpense>>({
    description: '',
    amount: '' as any,
    category: Category.HOUSING,
    frequency: 'monthly',
    nextDueDate: new Date().toISOString().split('T')[0],
    active: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newExpense.description && newExpense.amount && newExpense.nextDueDate) {
      onAdd({
        description: newExpense.description,
        amount: Number(newExpense.amount),
        category: newExpense.category as Category,
        frequency: newExpense.frequency as Frequency,
        nextDueDate: newExpense.nextDueDate,
        active: true
      });
      setIsAdding(false);
      setNewExpense({
        description: '',
        amount: '' as any,
        category: Category.HOUSING,
        frequency: 'monthly',
        nextDueDate: new Date().toISOString().split('T')[0],
        active: true
      });
    }
  };

  const getFrequencyLabel = (freq: string) => {
    switch (freq) {
      case 'daily': return 'Every Day';
      case 'weekly': return 'Every Week';
      case 'monthly': return 'Every Month';
      case 'yearly': return 'Every Year';
      default: return freq;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
            <h2 className="text-lg font-bold text-slate-800">Recurring Expenses</h2>
            <p className="text-slate-500 text-sm">Automate your rent, subscriptions, and salary</p>
        </div>
        <button
            onClick={() => setIsAdding(!isAdding)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isAdding ? 'bg-red-50 text-red-600' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
        >
            {isAdding ? <><Trash2 className="w-4 h-4" /> <span>Cancel</span></> : <><Plus className="w-4 h-4" /> <span>Add New</span></>}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-100 animate-in slide-in-from-top-2">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">New Recurring Rule</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
                    <input
                        type="text"
                        required
                        placeholder="e.g. Netflix Subscription"
                        value={newExpense.description}
                        onChange={e => setNewExpense({...newExpense, description: e.target.value})}
                        className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                </div>
                
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Amount (₹)</label>
                    <input
                        type="number"
                        required
                        placeholder="0.00"
                        value={newExpense.amount}
                        onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})}
                        className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Use negative for income (e.g. -50000)</p>
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Category</label>
                    <select
                        value={newExpense.category}
                        onChange={e => setNewExpense({...newExpense, category: e.target.value})}
                        className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                        {Object.values(Category).map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Frequency</label>
                    <select
                        value={newExpense.frequency}
                        onChange={e => setNewExpense({...newExpense, frequency: e.target.value as Frequency})}
                        className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Next Due Date</label>
                    <input
                        type="date"
                        required
                        value={newExpense.nextDueDate}
                        onChange={e => setNewExpense({...newExpense, nextDueDate: e.target.value})}
                        className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                </div>

                <div className="md:col-span-2 flex justify-end pt-2">
                    <button type="submit" className="px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">
                        Save Rule
                    </button>
                </div>
            </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recurringExpenses.map(item => (
            <div key={item.id} className={`bg-white p-5 rounded-xl border transition-all ${item.active ? 'border-slate-200 shadow-sm' : 'border-slate-100 opacity-60'}`}>
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-2">
                        <div className={`p-2 rounded-lg ${item.active ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                            <RefreshCw className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-slate-800 text-sm">{item.description}</h4>
                            <span className="text-xs text-slate-500">{item.category}</span>
                        </div>
                    </div>
                    <button onClick={() => onToggleActive(item.id)} className="text-slate-400 hover:text-indigo-600 transition-colors">
                        {item.active ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5" />}
                    </button>
                </div>
                
                <div className="flex justify-between items-center py-3 border-t border-slate-50">
                    <div className="text-xs">
                        <p className="text-slate-400">Amount</p>
                        <p className={`font-bold text-base ${item.amount < 0 ? 'text-green-600' : 'text-slate-700'}`}>
                            ₹{Math.abs(item.amount)}
                        </p>
                    </div>
                    <div className="text-right text-xs">
                        <p className="text-slate-400">Next Due</p>
                        <p className="font-medium text-slate-700">{item.nextDueDate}</p>
                    </div>
                </div>

                <div className="flex justify-between items-center mt-2 pt-2">
                    <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-600 rounded">
                        {getFrequencyLabel(item.frequency)}
                    </span>
                    <button 
                        onClick={() => onDelete(item.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        ))}
        
        {recurringExpenses.length === 0 && !isAdding && (
            <div className="col-span-full py-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <RefreshCw className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p>No recurring expenses set up.</p>
                <button onClick={() => setIsAdding(true)} className="text-indigo-500 font-medium text-sm mt-2 hover:underline">Add your first one</button>
            </div>
        )}
      </div>
    </div>
  );
};