import React from 'react';
import { Target, AlertTriangle } from 'lucide-react';
import { useBudgets } from '../hooks/queries/useBudgets';
import { useExpenses } from '../hooks/queries/useExpenses';

export const Budgets: React.FC = () => {
    const { data: budgets = [], isLoading: loadingBudgets } = useBudgets();
    const { data: expenses = [] } = useExpenses();

    // Calculate spend per category
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const categorySpend = expenses.reduce((acc, exp) => {
        const expDate = new Date(exp.date);
        if (expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear) {
            acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
        }
        return acc;
    }, {} as Record<string, number>);

    return (
        <div className="space-y-6 pb-20 md:pb-0 font-sans">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Monthly Budgets</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Track spending limits by category</p>
                </div>
            </div>

            {loadingBudgets ? (
                <div className="text-center py-8 text-slate-500">Loading budgets...</div>
            ) : budgets.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <Target className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-500 dark:text-slate-400">No budgets set. Go to Settings to configure them.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {budgets.map(budget => {
                        const spent = categorySpend[budget.category] || 0;
                        const remaining = budget.amount - spent;
                        const percentUsed = Math.min((spent / budget.amount) * 100, 100);
                        const isOverBudget = spent > budget.amount;
                        const isNearLimit = percentUsed >= 80 && !isOverBudget;

                        let colorClass = 'bg-[var(--accent-color)]';
                        if (isOverBudget) colorClass = 'bg-red-500';
                        else if (isNearLimit) colorClass = 'bg-yellow-500';

                        return (
                            <div key={budget.id} className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
                                {isOverBudget && (
                                    <div className="absolute top-0 right-0 p-2">
                                        <AlertTriangle className="w-5 h-5 text-red-500" />
                                    </div>
                                )}
                                <div className="flex justify-between items-end mb-4 pr-6">
                                    <div>
                                        <h3 className="font-semibold text-slate-800 dark:text-white">{budget.category}</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">₹{budget.amount.toLocaleString()} / month</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-xl font-bold ${isOverBudget ? 'text-red-500' : 'text-slate-800 dark:text-white'}`}>
                                            ₹{spent.toLocaleString()}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">spent</p>
                                    </div>
                                </div>

                                <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-3">
                                    <div
                                        className={`h-full transition-all duration-500 ${colorClass}`}
                                        style={{ width: `${percentUsed}%` }}
                                    />
                                </div>

                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-500 font-medium">
                                        {percentUsed.toFixed(0)}% used
                                    </span>
                                    <span className={isOverBudget ? 'text-red-500 font-medium' : 'text-green-600 dark:text-green-400 font-medium'}>
                                        {isOverBudget
                                            ? `Over by ₹${Math.abs(remaining).toLocaleString()}`
                                            : `₹${remaining.toLocaleString()} left`
                                        }
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
