import React, { useState, useEffect, useMemo } from 'react';
import { Trash2, Edit2, Save, X, Check } from 'lucide-react';
import { Expense, Category, FilterConfig } from '../types';
import { ExpenseFilters } from './ExpenseFilters';
import { COLORS } from '../constants';

interface ExpenseTableProps {
  expenses: Expense[];
  onDelete: (id: string) => void;
  onUpdate: (updatedExpense: Expense) => void;
}

const INITIAL_FILTERS: FilterConfig = {
  search: '',
  category: '',
  paymentMethod: '',
  startDate: '',
  endDate: '',
  type: 'all',
  minAmount: '',
  maxAmount: ''
};

export const ExpenseTable: React.FC<ExpenseTableProps> = ({ expenses, onDelete, onUpdate }) => {
  const [localExpenses, setLocalExpenses] = useState<Expense[]>(expenses);
  const [filters, setFilters] = useState<FilterConfig>(INITIAL_FILTERS);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Expense | null>(null);

  useEffect(() => {
    setLocalExpenses(expenses);
  }, [expenses]);

  // Extract unique payment methods for the filter dropdown
  const uniquePaymentMethods = useMemo(() => {
    const methods = new Set(expenses.map(e => e.paymentMethod));
    return Array.from(methods).filter(Boolean).sort();
  }, [expenses]);

  const handleEditClick = (expense: Expense) => {
    setEditingId(expense.id);
    setEditForm({ ...expense });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const handleSaveEdit = () => {
    if (editForm) {
      onUpdate(editForm);
      setEditingId(null);
      setEditForm(null);
    }
  };

  const handleInputChange = (key: keyof Expense, value: string) => {
    if (!editForm) return;

    if (key === 'amount') {
      const num = parseFloat(value);
      setEditForm({ ...editForm, [key]: isNaN(num) ? 0 : num });
    } else {
      setEditForm({ ...editForm, [key]: value });
    }
  };

  const getCategoryColor = (category: string) => {
    const categories = Object.values(Category);
    const index = categories.indexOf(category as Category);
    return index >= 0 ? COLORS[index % COLORS.length] : '#94a3b8';
  };

  const filteredExpenses = useMemo(() => {
    return localExpenses.filter(expense => {
      // Search
      if (filters.search && !expense.description.toLowerCase().includes(filters.search.toLowerCase())) return false;

      // Category
      if (filters.category && expense.category !== filters.category) return false;

      // Payment Method
      if (filters.paymentMethod && expense.paymentMethod !== filters.paymentMethod) return false;

      // Date Range
      if (filters.startDate && expense.date < filters.startDate) return false;
      if (filters.endDate && expense.date > filters.endDate) return false;

      // Type
      if (filters.type === 'income' && expense.amount >= 0) return false;
      // if type is 'expense', we want positive amounts.
      if (filters.type === 'expense' && expense.amount < 0) return false;

      // Amount Range
      const absAmount = Math.abs(expense.amount);
      if (filters.minAmount && absAmount < parseFloat(filters.minAmount)) return false;
      if (filters.maxAmount && absAmount > parseFloat(filters.maxAmount)) return false;

      return true;
    });
  }, [localExpenses, filters]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-[calc(100vh-220px)] md:h-[700px] overflow-hidden">

      <ExpenseFilters
        filters={filters}
        onFilterChange={setFilters}
        isOpen={isFilterOpen}
        onToggle={() => setIsFilterOpen(!isFilterOpen)}
        onClear={() => setFilters(INITIAL_FILTERS)}
        paymentMethods={uniquePaymentMethods}
      />

      {/* Toolbar */}
      <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div className="text-slate-500 text-sm font-medium flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          <span>{filteredExpenses.length} Records</span>
        </div>
      </div>

      {/* Table */}
      <div className="flex-grow overflow-auto custom-scrollbar bg-white">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 sticky top-0 z-10">
            <tr>
              <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 w-16">#</th>
              <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 w-32">Date</th>
              <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Description</th>
              <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 w-40">Category</th>
              <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 w-32">Method</th>
              <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 text-right w-32">Amount</th>
              <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 text-center w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredExpenses.map((expense, index) => {
              const isEditing = editingId === expense.id;

              return (
                <tr key={expense.id} className={`hover:bg-slate-50 transition-colors ${isEditing ? 'bg-blue-50/30' : ''}`}>
                  {/* Index */}
                  <td className="py-3 px-4 text-sm text-slate-400">
                    {index + 1}
                  </td>

                  {/* Date */}
                  <td className="py-3 px-4 text-sm text-slate-600">
                    {isEditing ? (
                      <input
                        type="date"
                        value={editForm?.date}
                        onChange={(e) => handleInputChange('date', e.target.value)}
                        className="w-full p-1 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    ) : (
                      expense.date
                    )}
                  </td>

                  {/* Description */}
                  <td className="py-3 px-4 text-sm font-medium text-slate-800">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm?.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        className="w-full p-1 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    ) : (
                      expense.description
                    )}
                  </td>

                  {/* Category */}
                  <td className="py-3 px-4">
                    {isEditing ? (
                      <select
                        value={editForm?.category}
                        onChange={(e) => handleInputChange('category', e.target.value)}
                        className="w-full p-1 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      >
                        {Object.values(Category).map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full mr-1.5" style={{ backgroundColor: getCategoryColor(expense.category) }}></span>
                        {expense.category}
                      </span>
                    )}
                  </td>

                  {/* Method */}
                  <td className="py-3 px-4 text-sm text-slate-500">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm?.paymentMethod}
                        onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                        className="w-full p-1 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    ) : (
                      expense.paymentMethod
                    )}
                  </td>

                  {/* Amount */}
                  <td className={`py-3 px-4 text-sm font-mono text-right ${expense.amount < 0 ? 'text-green-600 font-semibold' : 'text-slate-700'}`}>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editForm?.amount}
                        onChange={(e) => handleInputChange('amount', e.target.value)}
                        className="w-full p-1 border border-slate-300 rounded text-sm text-right focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    ) : (
                      `₹${Math.abs(expense.amount).toFixed(2)}`
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {isEditing ? (
                        <>
                          <button
                            onClick={handleSaveEdit}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="Save"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEditClick(expense)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDelete(expense.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredExpenses.length === 0 && (
          <div className="p-8 text-center text-slate-400">
            <p className="text-sm">No expenses found matching your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};