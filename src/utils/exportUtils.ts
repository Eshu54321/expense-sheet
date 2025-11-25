import { Expense } from '../types';

export const exportToCSV = (expenses: Expense[]) => {
    if (!expenses.length) return;

    // Define headers
    const headers = ['Date', 'Description', 'Category', 'Amount', 'Payment Method', 'ID'];

    // Convert data to CSV rows
    const rows = expenses.map(expense => [
        expense.date,
        `"${expense.description.replace(/"/g, '""')}"`, // Escape quotes
        expense.category,
        expense.amount,
        expense.paymentMethod,
        expense.id
    ]);

    // Combine headers and rows
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `expenses_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
