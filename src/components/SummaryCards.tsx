import React from 'react';
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
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
    // Mobile: Horizontal Scroll (Carousel). Desktop: Grid
    <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 md:grid md:grid-cols-3 md:gap-6 md:pb-8 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">

      {/* Balance Card - Premium Dark Look */}
      <div className="min-w-[85%] md:min-w-0 snap-center bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-2xl shadow-lg text-white flex flex-col justify-between h-[160px] relative overflow-hidden group ring-1 ring-white/10">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-white/10 transition-all"></div>

        <div className="flex items-center space-x-3 z-10">
          <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
            <Wallet className="w-5 h-5 text-indigo-300" />
          </div>
          <span className="text-indigo-100 font-medium text-sm">Total Balance</span>
        </div>

        <div className="z-10">
          <p className={`text-3xl font-bold tracking-tight ${summary.balance < 0 ? 'text-red-300' : 'text-white'}`}>
            {summary.balance < 0 ? '-' : ''}₹{Math.abs(summary.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-slate-400 text-xs mt-1">Available to spend</p>
        </div>
      </div>

      {/* Expense Card */}
      <div className="min-w-[85%] md:min-w-0 snap-center bg-white p-6 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col justify-between h-[160px]">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-50 rounded-lg">
              <TrendingDown className="w-5 h-5 text-red-500" />
            </div>
            <span className="text-slate-500 font-medium text-sm">Expenses</span>
          </div>
          <div className="flex items-center text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">
            <ArrowDownRight className="w-3 h-3 mr-1" />
            Outgoing
          </div>
        </div>

        <div>
          <p className="text-3xl font-bold text-slate-800 tracking-tight">
            ₹{summary.expense.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <div className="w-full bg-slate-100 h-1.5 mt-3 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 rounded-full" style={{ width: '70%' }}></div>
          </div>
        </div>
      </div>

      {/* Income Card */}
      <div className="min-w-[85%] md:min-w-0 snap-center bg-white p-6 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col justify-between h-[160px]">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <span className="text-slate-500 font-medium text-sm">Income</span>
          </div>
          <div className="flex items-center text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
            <ArrowUpRight className="w-3 h-3 mr-1" />
            Incoming
          </div>
        </div>

        <div>
          <p className="text-3xl font-bold text-slate-800 tracking-tight">
            ₹{summary.income.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <div className="w-full bg-slate-100 h-1.5 mt-3 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full" style={{ width: '45%' }}></div>
          </div>
        </div>
      </div>

    </div>
  );
};