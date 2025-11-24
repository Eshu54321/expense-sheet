import React, { useState, useMemo } from 'react';
import { Download, Calendar, TrendingUp, TrendingDown, BarChart2, List, Layers } from 'lucide-react';
import { Expense } from '../types';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Cell,
  Legend
} from 'recharts';
import { COLORS } from '../constants';

interface ReportsProps {
    expenses: Expense[];
}

type DateRange = 'this_month' | 'last_month' | 'last_3_months' | 'last_6_months' | 'ytd' | 'all';
type Aggregation = 'daily' | 'weekly' | 'monthly';

export const Reports: React.FC<ReportsProps> = ({ expenses }) => {
    const [dateRange, setDateRange] = useState<DateRange>('this_month');
    const [aggregation, setAggregation] = useState<Aggregation>('daily');
    const [viewMode, setViewMode] = useState<'transactions' | 'aggregated'>('transactions');

    // 1. Filter Expenses by Date Range
    const filteredExpenses = useMemo(() => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        let startDate = new Date(0); // Epoch
        let endDate = new Date(9999, 11, 31);

        switch (dateRange) {
            case 'this_month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'last_month':
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                endDate = new Date(now.getFullYear(), now.getMonth(), 0);
                break;
            case 'last_3_months':
                startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
                break;
            case 'last_6_months':
                startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
                break;
            case 'ytd':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            case 'all':
                startDate = new Date(0);
                break;
        }

        const startStr = startDate.toISOString().split('T')[0];
        const endStr = endDate.toISOString().split('T')[0];

        return expenses.filter(e => e.date >= startStr && e.date <= endStr);
    }, [expenses, dateRange]);

    // 2. Aggregate Data
    const aggregatedData = useMemo(() => {
        const map = new Map<string, { label: string, income: number, expense: number, date: string }>();

        const getWeekStart = (d: Date) => {
            const day = d.getDay(); // 0 is Sunday
            // Adjust to make Monday the start (1)
            const diff = d.getDate() - (day === 0 ? 6 : day - 1);
            const newDate = new Date(d);
            newDate.setDate(diff);
            return newDate.toISOString().split('T')[0];
        };

        filteredExpenses.forEach(e => {
            let key = '';
            let label = '';
            const d = new Date(e.date);

            if (aggregation === 'daily') {
                key = e.date;
                label = new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            } else if (aggregation === 'weekly') {
                key = getWeekStart(d);
                label = `Week of ${new Date(key).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
            } else if (aggregation === 'monthly') {
                key = e.date.substring(0, 7); // YYYY-MM
                label = new Date(key + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            }

            if (!map.has(key)) {
                map.set(key, { label, income: 0, expense: 0, date: key });
            }
            const entry = map.get(key)!;
            if (e.amount < 0) {
                entry.income += Math.abs(e.amount);
            } else {
                entry.expense += e.amount;
            }
        });

        return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
    }, [filteredExpenses, aggregation]);

    // 3. Summaries (Total)
    const summary = useMemo(() => {
        return filteredExpenses.reduce((acc, curr) => {
            if (curr.amount < 0) {
                acc.income += Math.abs(curr.amount);
            } else {
                acc.expense += curr.amount;
            }
            return acc;
        }, { income: 0, expense: 0 });
    }, [filteredExpenses]);

    // 4. Category Data for Pie/Bar
    const categoryData = useMemo(() => {
        const map = new Map<string, number>();
        filteredExpenses.forEach(e => {
            if (e.amount > 0) {
                map.set(e.category, (map.get(e.category) || 0) + e.amount);
            }
        });
        return Array.from(map.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [filteredExpenses]);

    const handleDownload = () => {
        let headers: string[] = [];
        let rows: string[][] = [];

        if (viewMode === 'transactions') {
             headers = ['Date', 'Description', 'Category', 'Method', 'Amount'];
             rows = filteredExpenses.map(e => [
                e.date,
                `"${e.description.replace(/"/g, '""')}"`,
                e.category,
                e.paymentMethod,
                e.amount.toString()
            ]);
        } else {
            headers = ['Period', 'Income', 'Expense', 'Net Balance'];
            rows = aggregatedData.map(d => [
                d.label,
                d.income.toString(),
                d.expense.toString(),
                (d.income - d.expense).toString()
            ]);
        }
        
        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `report_${dateRange}_${aggregation}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            {/* Header Controls */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">Financial Reports</h2>
                    <p className="text-slate-500 text-sm">Analyze spending patterns over time</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    {/* Time Range */}
                    <div className="relative">
                        <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <select 
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value as DateRange)}
                            className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none bg-white min-w-[140px]"
                        >
                            <option value="this_month">This Month</option>
                            <option value="last_month">Last Month</option>
                            <option value="last_3_months">Last 3 Months</option>
                            <option value="last_6_months">Last 6 Months</option>
                            <option value="ytd">Year to Date</option>
                            <option value="all">All Time</option>
                        </select>
                    </div>

                    {/* Aggregation Toggle */}
                    <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                        {(['daily', 'weekly', 'monthly'] as Aggregation[]).map((type) => (
                            <button
                                key={type}
                                onClick={() => setAggregation(type)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all ${
                                    aggregation === type 
                                    ? 'bg-white text-slate-800 shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                    
                    <button 
                        onClick={handleDownload}
                        className="flex items-center space-x-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium ml-auto md:ml-0"
                    >
                        <Download className="w-4 h-4" />
                        <span className="hidden md:inline">Export</span>
                    </button>
                </div>
            </div>

            {/* Charts & Summary Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Financial Summary */}
                <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
                     <div>
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-6">Summary</h3>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-white rounded-md shadow-sm">
                                        <TrendingDown className="w-5 h-5 text-red-500" />
                                    </div>
                                    <span className="text-slate-700 font-medium">Expenses</span>
                                </div>
                                <span className="text-xl font-bold text-slate-800">₹{summary.expense.toFixed(0)}</span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-100">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-white rounded-md shadow-sm">
                                        <TrendingUp className="w-5 h-5 text-green-500" />
                                    </div>
                                    <span className="text-slate-700 font-medium">Income</span>
                                </div>
                                <span className="text-xl font-bold text-slate-800">₹{summary.income.toFixed(0)}</span>
                            </div>
                        </div>
                     </div>
                     <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-end">
                        <span className="text-slate-500 font-medium">Net Balance</span>
                        <span className={`text-2xl font-bold ${summary.income - summary.expense >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {summary.income - summary.expense >= 0 ? '+' : ''}₹{(summary.income - summary.expense).toFixed(0)}
                        </span>
                     </div>
                </div>

                {/* Main Trend Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Income vs Expense Trend</h3>
                        <span className="text-xs text-slate-400 capitalize">{aggregation} View</span>
                     </div>
                     <div className="h-[300px] w-full">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={aggregatedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="label" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 12, fill: '#94a3b8'}}
                                    minTickGap={30}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 12, fill: '#94a3b8'}}
                                    tickFormatter={(val) => `₹${val/1000}k`}
                                />
                                <Tooltip 
                                    formatter={(value: number) => `₹${value.toFixed(2)}`}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    cursor={{fill: '#f8fafc'}}
                                />
                                <Legend wrapperStyle={{paddingTop: '20px'}} />
                                <Bar name="Income" dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                <Bar name="Expense" dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={50} />
                            </BarChart>
                         </ResponsiveContainer>
                     </div>
                </div>
            </div>

            {/* Category Breakdown (Secondary) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                 <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Category Breakdown ({dateRange.replace(/_/g, ' ')})</h3>
                 <div className="h-48 w-full">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={categoryData.slice(0, 10)} layout="vertical" margin={{ left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={140} tick={{fontSize: 12, fill: '#64748b'}} tickLine={false} axisLine={false}/>
                            <Tooltip 
                                formatter={(value: number) => `₹${value.toFixed(2)}`}
                                cursor={{fill: 'transparent'}}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20}>
                                {categoryData.slice(0, 10).map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                     </ResponsiveContainer>
                 </div>
            </div>

            {/* Data Table with Toggle */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div className="flex space-x-1 bg-white border border-slate-200 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('transactions')}
                            className={`flex items-center space-x-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === 'transactions' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <List className="w-3.5 h-3.5" />
                            <span>Transactions</span>
                        </button>
                        <button
                            onClick={() => setViewMode('aggregated')}
                            className={`flex items-center space-x-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === 'aggregated' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Layers className="w-3.5 h-3.5" />
                            <span>Aggregated View</span>
                        </button>
                    </div>
                    <span className="text-xs text-slate-400">
                        {viewMode === 'transactions' ? `${filteredExpenses.length} Records` : `${aggregatedData.length} Periods`}
                    </span>
                </div>

                <div className="overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar">
                    {viewMode === 'transactions' ? (
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Date</th>
                                    <th className="px-6 py-3 font-medium">Description</th>
                                    <th className="px-6 py-3 font-medium">Category</th>
                                    <th className="px-6 py-3 font-medium text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredExpenses.length > 0 ? (
                                    filteredExpenses.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(expense => (
                                        <tr key={expense.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-3 text-slate-600 whitespace-nowrap">{expense.date}</td>
                                            <td className="px-6 py-3 font-medium text-slate-800">{expense.description}</td>
                                            <td className="px-6 py-3">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                                    {expense.category}
                                                </span>
                                            </td>
                                            <td className={`px-6 py-3 text-right font-medium whitespace-nowrap ${expense.amount < 0 ? 'text-green-600' : 'text-slate-800'}`}>
                                                {expense.amount < 0 ? '+' : ''}₹{Math.abs(expense.amount).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                            No transactions found for this period.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Period</th>
                                    <th className="px-6 py-3 font-medium text-right text-green-600">Income</th>
                                    <th className="px-6 py-3 font-medium text-right text-red-600">Expense</th>
                                    <th className="px-6 py-3 font-medium text-right">Net Balance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {aggregatedData.length > 0 ? (
                                    aggregatedData.map((data, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-3 font-medium text-slate-700">{data.label}</td>
                                            <td className="px-6 py-3 text-right text-green-600 font-medium">₹{data.income.toFixed(2)}</td>
                                            <td className="px-6 py-3 text-right text-red-600 font-medium">₹{data.expense.toFixed(2)}</td>
                                            <td className={`px-6 py-3 text-right font-bold ${data.income - data.expense >= 0 ? 'text-slate-700' : 'text-red-600'}`}>
                                                {data.income - data.expense >= 0 ? '+' : ''}₹{(data.income - data.expense).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                            No data available for this aggregation.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};
