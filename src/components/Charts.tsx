import React, { useMemo, useState, useEffect } from 'react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    AreaChart, Area, Legend, LineChart, Line
} from 'recharts';
import { Expense } from '../types';
import { COLORS } from '../constants';
import { useAccounts } from '../hooks/queries/useAccounts';

interface ChartsProps {
    expenses: Expense[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/95 backdrop-blur-sm p-3 border border-slate-100 shadow-xl rounded-xl ring-1 ring-slate-900/5">
                <p className="text-xs text-slate-500 font-medium mb-1">{label}</p>
                <div className="flex items-center gap-2">
                    <span className="w-1 h-4 bg-indigo-500 rounded-full"></span>
                    <p className="text-sm font-bold text-slate-800">
                        ₹{Number(payload[0].value).toFixed(2)}
                    </p>
                </div>
            </div>
        );
    }
    return null;
};

export const Charts: React.FC<ChartsProps> = ({ expenses }) => {
    const { data: accounts = [] } = useAccounts();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsMounted(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const expenseData = useMemo(() => expenses.filter(e => e.amount > 0), [expenses]);

    const categoryData = useMemo(() => {
        const map = new Map<string, number>();
        expenseData.forEach(e => {
            const current = map.get(e.category) || 0;
            map.set(e.category, current + e.amount);
        });
        return Array.from(map.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [expenseData]);

    const dailyTrendData = useMemo(() => {
        const map = new Map<string, number>();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        expenseData.forEach(e => {
            const date = new Date(e.date);
            if (date >= thirtyDaysAgo) {
                const current = map.get(e.date) || 0;
                map.set(e.date, current + e.amount);
            }
        });

        return Array.from(map.entries())
            .map(([date, amount]) => ({ date, amount }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [expenseData]);

    const creditCardTrendData = useMemo(() => {
        const creditCards = accounts.filter(a => a.type === 'credit_card');
        if (!creditCards.length) return [];

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // 1. Filter expenses to current month and where payment method is a credit card
        const ccExpenses = expenseData.filter(e => {
            const date = new Date(e.date);
            if (date.getMonth() !== currentMonth || date.getFullYear() !== currentYear) return false;
            // The expense's paymentMethod could be the account ID or the account Name depending on saving logic
            return creditCards.some(cc => cc.id === e.paymentMethod || cc.name === e.paymentMethod);
        });

        // 2. Build a map of Dates within this month
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const map = new Map<string, Record<string, number>>();

        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const initialDayRecord: Record<string, number> = { day: i };
            creditCards.forEach(cc => initialDayRecord[cc.name] = 0);
            map.set(dateStr, initialDayRecord);
        }

        // 3. Accumulate expenses
        ccExpenses.forEach(e => {
            const dayRecord = map.get(e.date);
            if (dayRecord) {
                // Determine which CC this expense belongs to
                const matchedCard = creditCards.find(cc => cc.id === e.paymentMethod || cc.name === e.paymentMethod);
                if (matchedCard) {
                    dayRecord[matchedCard.name] += e.amount;
                }
            }
        });

        // 4. Return array format for Recharts
        return Array.from(map.values());
    }, [expenseData, accounts]);

    const totalExpense = useMemo(() => expenseData.reduce((sum, item) => sum + item.amount, 0), [expenseData]);

    if (!isMounted) {
        return (
            <div className="space-y-6 mb-8 animate-pulse">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 h-[280px] bg-slate-200 rounded-2xl"></div>
                    <div className="h-[280px] bg-slate-200 rounded-2xl"></div>
                </div>
                <div className="h-[200px] bg-slate-200 rounded-2xl"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 mb-8">
            {/* Row 1: Trend & Categories */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Daily Trend Area Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-100">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 tracking-tight">Spending Trend</h3>
                            <p className="text-sm text-slate-400 font-medium">Last 30 Days</p>
                        </div>
                    </div>
                    <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                            <AreaChart data={dailyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 500 }}
                                    tickFormatter={(str) => {
                                        const date = new Date(str);
                                        return `${date.getDate()} ${date.toLocaleString('default', { month: 'short' })}`;
                                    }}
                                    minTickGap={30}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 500 }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="amount"
                                    stroke="#6366f1"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorAmount)"
                                    activeDot={{ r: 6, strokeWidth: 0, fill: '#4f46e5' }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Category Donut Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-100 flex flex-col">
                    <h3 className="text-lg font-bold text-slate-800 tracking-tight mb-1">Categories</h3>
                    <p className="text-sm text-slate-400 font-medium mb-4">Distribution</p>

                    <div className="h-[200px] w-full relative flex-shrink-0">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={4}
                                    dataKey="value"
                                    cornerRadius={6}
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total</span>
                            <span className="text-xl font-bold text-slate-800">
                                ₹{totalExpense > 100000 ? `${(totalExpense / 100000).toFixed(1)}L` : totalExpense > 1000 ? `${(totalExpense / 1000).toFixed(1)}k` : totalExpense.toFixed(0)}
                            </span>
                        </div>
                    </div>

                    {/* Detailed Category List */}
                    <div className="mt-4 space-y-3 overflow-y-auto max-h-[200px] custom-scrollbar pr-2 border-t border-slate-50 pt-4">
                        {categoryData.map((d, i) => (
                            <div key={d.name} className="flex items-center justify-between text-sm group">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                                    <span className="text-slate-600 group-hover:text-slate-900 transition-colors truncate max-w-[120px]" title={d.name}>{d.name}</span>
                                </div>
                                <span className="font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">
                                    ₹{d.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Row 2: Credit Card Trends */}
            {creditCardTrendData.length > 0 && (
                <div className="bg-white p-6 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 tracking-tight mb-1">Credit Card Spends</h3>
                    <p className="text-sm text-slate-400 font-medium mb-6">Current Month Trends</p>

                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={creditCardTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="day"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 500 }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 500 }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                {accounts.filter(a => a.type === 'credit_card').map((cc, idx) => (
                                    <Line
                                        key={cc.id}
                                        type="monotone"
                                        dataKey={cc.name}
                                        stroke={COLORS[idx % COLORS.length]}
                                        strokeWidth={3}
                                        dot={{ r: 4, strokeWidth: 0, fill: COLORS[idx % COLORS.length] }}
                                        activeDot={{ r: 6 }}
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
};