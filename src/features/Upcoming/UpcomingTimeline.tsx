import React, { useMemo } from 'react';
import { RecurringExpense, Lender } from '../../types';
import { RefreshCw, Users, AlertCircle } from 'lucide-react';
import { useLenders } from '../../hooks/queries/useLenders';

interface UpcomingTimelineProps {
    recurringExpenses: RecurringExpense[];
}

interface TimelineItem {
    id: string;
    title: string;
    amount: number;
    date: Date;
    type: 'recurring' | 'debt';
    icon: React.ReactNode;
    subtitle: string;
}

export const UpcomingTimeline: React.FC<UpcomingTimelineProps> = ({
    recurringExpenses
}) => {
    const { data: lenders = [] } = useLenders();
    // Aggregate and sort data
    const { timelineItems, totalUpcoming, totalPaid } = useMemo(() => {
        const items: TimelineItem[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Process Active Recurring Expenses
        recurringExpenses.forEach(rule => {
            if (rule.active && rule.nextDueDate) {
                const dueDate = new Date(rule.nextDueDate);

                let projectionDate = new Date(dueDate);

                // Roll forward if the due date is in the past (e.g. user hasn't opened app)
                while (projectionDate < today) {
                    if (rule.frequency === 'daily') projectionDate.setDate(projectionDate.getDate() + 1);
                    else if (rule.frequency === 'weekly') projectionDate.setDate(projectionDate.getDate() + 7);
                    else if (rule.frequency === 'monthly') projectionDate.setMonth(projectionDate.getMonth() + 1);
                    else if (rule.frequency === 'yearly') projectionDate.setFullYear(projectionDate.getFullYear() + 1);
                }

                // Add only the single next occurrence
                items.push({
                    id: `rec_${rule.id}_next`,
                    title: rule.description || rule.category,
                    amount: rule.amount,
                    date: new Date(projectionDate),
                    type: 'recurring',
                    icon: <RefreshCw className="w-4 h-4 text-white" />,
                    subtitle: 'VIA AUTO DEBIT'
                });
            }
        });

        // 2. Process Lenders (Active Debts & Receivables)
        lenders.forEach(lender => {
            // Positive currentBalance means we owe them (Debt)
            if (lender.currentBalance > 0) {
                // Loans don't have a strict due date in current schema, we'll place them as 'Today'
                const dueDate = new Date();

                items.push({
                    id: `lend_${lender.id}`,
                    title: lender.name,
                    amount: lender.currentBalance,
                    date: dueDate,
                    type: 'debt',
                    icon: <Users className="w-4 h-4 text-white" />,
                    subtitle: 'PAY NOW'
                });
            }
        });

        // Sort chronologically
        items.sort((a, b) => a.date.getTime() - b.date.getTime());

        // Calculate Totals (mocking 'paid' for UI fidelity since we don't have explicit paid statuses in recurring yet)
        const upcoming = items.reduce((sum, item) => sum + item.amount, 0);
        const paid = 0; // Future enhancement

        return { timelineItems: items, totalUpcoming: upcoming, totalPaid: paid };
    }, [recurringExpenses, lenders]);


    // Helper to format relative date strings
    const getRelativeDateString = (date: Date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const itemDate = new Date(date);
        itemDate.setHours(0, 0, 0, 0);

        const diffTime = itemDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'due today';
        if (diffDays === 1) return 'due tomorrow';
        if (diffDays > 1 && diffDays < 7) return `due in ${diffDays} days`;
        if (diffDays < 0) return `overdue by ${Math.abs(diffDays)} days`;

        return itemDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    };

    // Group items by broad time buckets for dividers
    const groupedItems = timelineItems.reduce((acc, item) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const itemDate = new Date(item.date);
        itemDate.setHours(0, 0, 0, 0);

        const diffTime = itemDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let key = 'LATER';
        if (diffDays === 0) key = 'TODAY';
        else if (diffDays === 1) key = 'TOMORROW';
        else if (diffDays > 1 && diffDays <= 7) key = 'THIS WEEK';
        else if (diffDays < 0) key = 'OVERDUE';

        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
    }, {} as Record<string, TimelineItem[]>);

    // Define order of groups
    const groupOrder = ['OVERDUE', 'TODAY', 'TOMORROW', 'THIS WEEK', 'LATER'];

    if (timelineItems.length === 0) {
        return (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-slate-100 flex flex-col items-center justify-center h-64">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-700">No Upcoming Payments</h3>
                <p className="text-slate-500 text-sm mt-2">You are all caught up! No active subscriptions or debts found.</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden font-sans">

            {/* Header section matching UI */}
            <div className="p-6 md:p-8 flex justify-between items-end border-b border-slate-100/50">
                <div>
                    <p className="text-[11px] font-bold text-slate-400 tracking-widest uppercase mb-1">Upcoming</p>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                        ₹{totalUpcoming.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </h2>
                </div>
                <div className="text-right">
                    <p className="text-[11px] font-bold text-slate-400 tracking-widest uppercase mb-1">Paid</p>
                    <h2 className="text-xl font-bold tracking-tight text-slate-900">
                        ₹{totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </h2>
                </div>
            </div>

            <div className="bg-slate-50 px-6 py-3 border-b border-dashed border-slate-200">
                <p className="text-[11px] font-bold text-slate-500 tracking-widest uppercase mb-0">
                    {timelineItems.length} Upcoming
                </p>
            </div>

            {/* Timeline Body */}
            <div className="py-6 relative">

                {/* Continuous vertical dashed line */}
                <div className="absolute top-0 bottom-0 left-[62px] w-px border-l border-dashed border-slate-200 hidden sm:block"></div>

                {groupOrder.map(groupKey => {
                    const items = groupedItems[groupKey];
                    if (!items || items.length === 0) return null;

                    return (
                        <div key={groupKey} className="mb-0">

                            {/* Divider Pill (e.g., TODAY) */}
                            <div className="relative flex items-center justify-center py-6 group-divider">
                                <div className="absolute left-0 right-0 h-px border-t border-dashed border-slate-300"></div>
                                <div className="relative z-10 bg-white border border-slate-900 rounded-full px-4 py-1.5 text-[10px] font-bold tracking-widest text-slate-900 uppercase">
                                    {groupKey}
                                </div>
                            </div>

                            {/* Items for this group */}
                            <div className="space-y-4 px-4 sm:px-6">
                                {items.map(item => (
                                    <div key={item.id} className="flex items-center gap-4 sm:gap-6 relative z-10">

                                        {/* Icon / Avatar (Left side of timeline) */}
                                        <div className="w-12 h-12 flex-shrink-0 rounded-full border border-slate-100 bg-white flex items-center justify-center shadow-sm relative z-20 overflow-hidden mx-auto sm:mx-0">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.type === 'recurring' ? 'bg-indigo-500' : 'bg-rose-500'}`}>
                                                {item.icon}
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100">
                                                <span className="text-[8px] font-bold italic text-red-600">i</span>
                                            </div>
                                        </div>

                                        {/* Main Card details (Right side of timeline) */}
                                        <div className="flex-1 bg-white border border-slate-900 rounded-lg p-4 shadow-sm relative">
                                            {/* Left pointing triangle connecting card to bubble */}
                                            <div className="absolute top-1/2 -left-2 -translate-y-1/2 w-4 h-4 bg-white border-l border-b border-slate-900 transform rotate-45 hidden sm:block z-0"></div>

                                            <div className="flex justify-between items-start relative z-10 bg-white">
                                                <div className="pr-4">
                                                    <h4 className="text-[15px] font-bold text-slate-800 mb-1">{item.title}</h4>
                                                    <p className={`text-sm ${item.date < new Date() ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
                                                        {getRelativeDateString(item.date)}
                                                    </p>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <h4 className="text-[17px] font-bold text-slate-900 mb-2">
                                                        ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                    </h4>
                                                    <span className={`text-[10px] font-bold tracking-widest uppercase ${item.type === 'debt' ? 'text-slate-500' : 'text-slate-400'}`}>
                                                        {item.subtitle}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Footer Total */}
            <div className="bg-slate-50 p-6 md:p-8 flex justify-between items-center border-t border-dashed border-slate-200">
                <p className="text-[11px] font-bold text-slate-400 tracking-widest uppercase">Total</p>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                    ₹{totalUpcoming.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </h2>
            </div>

        </div>
    );
};
