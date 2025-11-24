import React, { useState, useEffect, useMemo } from 'react';
import { Trash2, Plus, Save } from 'lucide-react';
import { Expense, Category, FilterConfig } from '../types';
import { ExpenseFilters } from './ExpenseFilters';
import { COLORS } from '../constants';

interface ExpenseTableProps {
  expenses: Expense[];
  onDelete: (id: string) => void;
  onUpdate: (updatedExpense: Expense) => void;
}

const COLUMNS = [
  { label: 'A', key: 'date', width: '120px' },
  { label: 'B', key: 'description', width: '250px' },
  { label: 'C', key: 'category', width: '180px' },
  { label: 'D', key: 'paymentMethod', width: '150px' },
  { label: 'E', key: 'amount', width: '120px' },
];

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

  useEffect(() => {
    setLocalExpenses(expenses);
  }, [expenses]);

  // Extract unique payment methods for the filter dropdown
  const uniquePaymentMethods = useMemo(() => {
    const methods = new Set(expenses.map(e => e.paymentMethod));
    return Array.from(methods).filter(Boolean).sort();
  }, [expenses]);

  const handleCellChange = (id: string, key: keyof Expense, value: string) => {
    setLocalExpenses(prev => prev.map(e => {
      if (e.id === id) {
        // Handle amount conversion
        if (key === 'amount') {
          const num = parseFloat(value);
          return { ...e, [key]: isNaN(num) ? 0 : num };
        }
        return { ...e, [key]: value };
      }
      return e;
    }));
  };

  const handleBlur = (expense: Expense) => {
    onUpdate(expense);
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
      <div className="p-2 border-b border-slate-200 bg-slate-50 flex items-center gap-2 overflow-x-auto">
        <div className="text-slate-500 text-sm font-medium px-2 flex items-center gap-1 whitespace-nowrap">
          <span className="w-2 h-2 md:w-3 md:h-3 bg-green-500 rounded-full"></span>
          <span className="hidden md:inline">Sheet Mode: Auto-saved to Local Database</span>
          <span className="md:hidden text-xs">Auto-saved</span>
        </div>
        <div className="flex-1"></div>
        <div className="text-xs text-slate-400 mr-2 md:mr-4 whitespace-nowrap">
           {filteredExpenses.length} records
        </div>
        <button className="flex items-center gap-1 text-xs font-medium text-slate-600 bg-white border border-slate-300 px-3 py-1.5 rounded hover:bg-slate-50">
          <Save className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Saved</span>
        </button>
      </div>

      {/* Spreadsheet Grid */}
      <div className="flex-grow overflow-auto custom-scrollbar relative bg-white">
        <table className="text-left border-collapse table-fixed" style={{ minWidth: '820px' }}>
          <thead className="bg-slate-100 sticky top-0 z-20 shadow-sm">
            <tr>
              <th className="w-10 border-b border-r border-slate-300 bg-slate-100 sticky left-0 z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"></th>
              {COLUMNS.map((col) => (
                <th key={col.key} style={{ width: col.width }} className="py-1 px-2 font-normal text-xs text-slate-500 text-center border-b border-r border-slate-300 bg-slate-100 select-none">
                  {col.label}
                </th>
              ))}
              <th className="w-12 border-b border-slate-300 bg-slate-100"></th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.map((expense, index) => (
              <tr key={expense.id} className="hover:bg-blue-50/20 group">
                {/* Row Number (Visual Index) */}
                <td className="w-10 text-center text-xs text-slate-500 bg-slate-50 border-r border-b border-slate-200 sticky left-0 z-10 select-none shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  {index + 1}
                </td>
                
                {/* Date */}
                <td className="border-r border-b border-slate-200 p-0">
                  <input 
                    type="text" 
                    value={expense.date} 
                    onChange={(e) => handleCellChange(expense.id, 'date', e.target.value)}
                    onBlur={() => handleBlur(expense)}
                    className="w-full h-full py-3 md:py-2 px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-blue-50 transition-all border-none bg-transparent"
                  />
                </td>

                {/* Description */}
                <td className="border-r border-b border-slate-200 p-0">
                  <input 
                    type="text" 
                    value={expense.description} 
                    onChange={(e) => handleCellChange(expense.id, 'description', e.target.value)}
                    onBlur={() => handleBlur(expense)}
                    className="w-full h-full py-3 md:py-2 px-3 text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-blue-50 transition-all border-none bg-transparent"
                  />
                </td>

                {/* Category */}
                <td className="border-r border-b border-slate-200 p-0 relative">
                   <div 
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full pointer-events-none z-10"
                      style={{ backgroundColor: getCategoryColor(expense.category) }}
                   />
                   <select
                      value={expense.category}
                      onChange={(e) => {
                          handleCellChange(expense.id, 'category', e.target.value);
                          const updated = { ...expense, category: e.target.value };
                          handleBlur(updated);
                      }}
                      className="w-full h-full py-3 md:py-2 pl-7 pr-3 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-blue-50 transition-all border-none bg-transparent appearance-none cursor-pointer relative z-0"
                   >
                     {Object.values(Category).map(c => (
                       <option key={c} value={c}>{c}</option>
                     ))}
                   </select>
                </td>

                {/* Method */}
                <td className="border-r border-b border-slate-200 p-0">
                  <input 
                    type="text" 
                    value={expense.paymentMethod} 
                    onChange={(e) => handleCellChange(expense.id, 'paymentMethod', e.target.value)}
                    onBlur={() => handleBlur(expense)}
                    className="w-full h-full py-3 md:py-2 px-3 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-blue-50 transition-all border-none bg-transparent"
                  />
                </td>

                {/* Amount */}
                <td className="border-r border-b border-slate-200 p-0">
                   <div className="relative h-full">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-light">₹</span>
                      <input 
                        type="number" 
                        value={expense.amount} 
                        onChange={(e) => handleCellChange(expense.id, 'amount', e.target.value)}
                        onBlur={() => handleBlur(expense)}
                        className={`w-full h-full py-3 md:py-2 pl-6 pr-3 text-sm font-mono text-right focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-blue-50 transition-all border-none bg-transparent ${expense.amount < 0 ? 'text-green-600' : 'text-slate-800'}`}
                      />
                   </div>
                </td>

                {/* Action */}
                <td className="border-b border-slate-200 p-0 text-center w-12 bg-white">
                  <button 
                    onClick={() => onDelete(expense.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Empty State / Add Row Area */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 text-center" style={{ minWidth: '820px' }}>
            {filteredExpenses.length === 0 ? (
                <p className="text-sm text-slate-400">No expenses match the current filters.</p>
            ) : (
                <p className="text-xs text-slate-400">End of Sheet</p>
            )}
        </div>
      </div>
    </div>
  );
};