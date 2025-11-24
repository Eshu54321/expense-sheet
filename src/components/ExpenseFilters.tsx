import React from 'react';
import { Search, Filter, X, RotateCcw } from 'lucide-react';
import { Category, FilterConfig } from '../types';

interface ExpenseFiltersProps {
  filters: FilterConfig;
  onFilterChange: (filters: FilterConfig) => void;
  isOpen: boolean;
  onToggle: () => void;
  onClear: () => void;
  paymentMethods: string[];
}

export const ExpenseFilters: React.FC<ExpenseFiltersProps> = ({ 
  filters, 
  onFilterChange,
  isOpen,
  onToggle,
  onClear,
  paymentMethods
}) => {
  const handleChange = (key: keyof FilterConfig, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const hasActiveFilters = filters.category || filters.paymentMethod || filters.startDate || filters.endDate || filters.type !== 'all' || filters.minAmount || filters.maxAmount;

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="p-3 flex items-center justify-between">
         <div className="flex items-center flex-1 max-w-md relative">
            <Search className="w-4 h-4 absolute left-3 text-slate-400" />
            <input 
              type="text" 
              value={filters.search}
              onChange={(e) => handleChange('search', e.target.value)}
              placeholder="Search transactions..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all"
            />
         </div>
         <div className="flex items-center space-x-2 ml-4">
            <button 
              onClick={onToggle}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${isOpen ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}
            >
               <Filter className="w-4 h-4" />
               <span>Filters</span>
               {hasActiveFilters && (
                 <span className="w-2 h-2 rounded-full bg-green-500 ml-1"></span>
               )}
            </button>
            {(filters.search || hasActiveFilters) && (
                <button 
                  onClick={onClear} 
                  className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                  title="Clear search and filters"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
         </div>
      </div>

      {isOpen && (
        <div className="p-4 bg-slate-50 border-t border-slate-200 animate-in slide-in-from-top-2 duration-200">
           <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Date Range</label>
                    <div className="flex items-center space-x-2">
                        <input 
                        type="date" 
                        value={filters.startDate}
                        onChange={(e) => handleChange('startDate', e.target.value)}
                        className="w-full text-sm p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                        />
                        <span className="text-slate-400">-</span>
                        <input 
                        type="date" 
                        value={filters.endDate}
                        onChange={(e) => handleChange('endDate', e.target.value)}
                        className="w-full text-sm p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Category</label>
                    <select 
                        value={filters.category}
                        onChange={(e) => handleChange('category', e.target.value)}
                        className="w-full text-sm p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                    >
                        <option value="">All Categories</option>
                        {Object.values(Category).map(c => (
                        <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Payment Method</label>
                    <select 
                        value={filters.paymentMethod}
                        onChange={(e) => handleChange('paymentMethod', e.target.value)}
                        className="w-full text-sm p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                    >
                        <option value="">All Methods</option>
                        {paymentMethods.map(method => (
                        <option key={method} value={method}>{method}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Type</label>
                    <div className="flex bg-white rounded-md border border-slate-300 overflow-hidden">
                        <button 
                        onClick={() => handleChange('type', 'all')}
                        className={`flex-1 py-2 text-xs font-medium ${filters.type === 'all' ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                        All
                        </button>
                        <div className="w-px bg-slate-300"></div>
                        <button 
                            onClick={() => handleChange('type', 'expense')}
                            className={`flex-1 py-2 text-xs font-medium ${filters.type === 'expense' ? 'bg-red-50 text-red-600' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                        Exp
                        </button>
                        <div className="w-px bg-slate-300"></div>
                        <button 
                            onClick={() => handleChange('type', 'income')}
                            className={`flex-1 py-2 text-xs font-medium ${filters.type === 'income' ? 'bg-green-50 text-green-600' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                        Inc
                        </button>
                    </div>
                </div>
                
                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Amount Range (₹)</label>
                    <div className="flex items-center space-x-2">
                        <input 
                        type="number" 
                        placeholder="Min"
                        value={filters.minAmount}
                        onChange={(e) => handleChange('minAmount', e.target.value)}
                        className="w-full text-sm p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                        />
                        <span className="text-slate-400">-</span>
                        <input 
                        type="number" 
                        placeholder="Max"
                        value={filters.maxAmount}
                        onChange={(e) => handleChange('maxAmount', e.target.value)}
                        className="w-full text-sm p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                        />
                    </div>
                </div>
           </div>

           {hasActiveFilters && (
             <div className="mt-4 flex justify-end border-t border-slate-200 pt-3">
                <button 
                    onClick={onClear}
                    className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-700 font-medium px-3 py-1.5 hover:bg-red-50 rounded-md transition-colors"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear All Filters</span>
                </button>
             </div>
           )}
        </div>
      )}
    </div>
  );
};