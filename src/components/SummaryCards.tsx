import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Wallet } from 'lucide-react';
import { Expense } from '../types';

interface SummaryCardsProps {
  expenses: Expense[];
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ expenses }) => {
  const summary = React.useMemo(() => {
    return expenses.reduce(
      (acc, curr) => {
        if (curr.amount < 0) {
          acc.income += Math.abs(curr.amount);
        } else {
          acc.expense += curr.amount;
        }
        acc.balance = acc.income - acc.expense;
        return acc;
      },
      { income: 0, expense: 0, balance: 0 }
    );
  }, [expenses]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4">
        <div className="p-3 bg-red-50 rounded-lg">
          <TrendingDown className="w-8 h-8 text-red-500" />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-medium">Total Expenses</p>
          <p className="text-2xl font-bold text-slate-800">₹{summary.expense.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4">
        <div className="p-3 bg-green-50 rounded-lg">
          <TrendingUp className="w-8 h-8 text-green-500" />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-medium">Total Income</p>
          <p className="text-2xl font-bold text-slate-800">₹{summary.income.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4">
        <div className="p-3 bg-blue-50 rounded-lg">
          <Wallet className="w-8 h-8 text-blue-500" />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-medium">Net Balance</p>
          <p className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-slate-800' : 'text-red-600'}`}>
            {summary.balance >= 0 ? '+' : '-'}₹{Math.abs(summary.balance).toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
};