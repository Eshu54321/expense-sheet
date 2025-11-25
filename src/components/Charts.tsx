import React, { useMemo, useState, useEffect } from 'react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    AreaChart, Area, Legend
} from 'recharts';
import { Expense } from '../types';
import { COLORS } from '../constants';
import { Loader2 } from 'lucide-react';

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

    const paymentMethodData = useMemo(() => {
        const map = new Map<string, number>();
        expenseData.forEach(e => {
            const method = e.paymentMethod || 'Other';
            const current = map.get(method) || 0;
            map.set(method, current + e.amount);
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

    const topExpensesData = useMemo(() => {
        return [...expenseData].sort((a, b) => b.amount - a.amount).slice(0, 5);
    }, [expenseData]);

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
                        <ResponsiveContainer width="100%" height="100%">
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
                        <ResponsiveContainer width="100%" height="100%">
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

                    {/* Mini Legend */}
                    <div className="mt-4 flex flex-wrap gap-2 justify-center">
                        {categoryData.slice(0, 3).map((d, i) => (
                            <div key={d.name} className="flex items-center gap-1 text-xs text-slate-500">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                                {d.name}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Row 2: Payment Methods & Top Expenses */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Payment Method Pie Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-100 flex flex-col">
                    <h3 className="text-lg font-bold text-slate-800 tracking-tight mb-1">Payment Mode</h3>
                    <p className="text-sm text-slate-400 font-medium mb-4">Usage</p>

                    <div className="h-[200px] w-full relative flex-shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={paymentMethodData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={0}
                                    outerRadius={80}
                                    paddingAngle={2}
                                    dataKey="value"
                                >
                                    {paymentMethodData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Expenses Bar Chart - Takes up 2 cols */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 tracking-tight mb-6">Top Transactions</h3>
                    <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={topExpensesData}
                                layout="vertical"
                                margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
                                barSize={20}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide />
                                <YAxis
                                    type="category"
                                    dataKey="description"
                                    width={180}
                                    tick={{ fontSize: 13, fill: '#475569', fontWeight: 500 }}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => value.length > 22 ? `${value.substring(0, 22)}...` : value}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc', radius: 4 }}
                                    content={<CustomTooltip />}
                                />
                                <Bar
                                    dataKey="amount"
                                    radius={[0, 6, 6, 0]}
                                    background={{ fill: '#f8fafc', radius: 6 }}
                                >
                                    {
                                        topExpensesData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#6366f1' : '#818cf8'} fillOpacity={index === 0 ? 1 : 0.7} />
                                        ))
                                    }
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};