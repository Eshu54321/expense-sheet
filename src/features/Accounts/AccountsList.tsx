import React, { useMemo } from 'react';
import { CreditCard, Landmark, Trash2, Edit2 } from 'lucide-react';
import { Account } from '../../types';
import { useDeleteAccount } from '../../hooks/queries/useAccounts';

interface AccountsListProps {
    accounts: Account[];
    onEdit: (account: Account) => void;
}

export const AccountsList: React.FC<AccountsListProps> = ({ accounts, onEdit }) => {
    const { mutate: deleteAccount } = useDeleteAccount();

    const bankAccounts = useMemo(() => accounts.filter(a => a.type === 'bank_account'), [accounts]);
    const creditCards = useMemo(() => accounts.filter(a => a.type === 'credit_card'), [accounts]);

    const totalBankBalance = bankAccounts.reduce((sum, acc) => sum + acc.balance, 0);
    const totalCreditUsed = creditCards.reduce((sum, acc) => sum + acc.balance, 0);
    const totalCreditLimit = creditCards.reduce((sum, acc) => sum + (acc.credit_limit || 0), 0);

    const formatCurrency = (amount: number) => {
        return '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const handleDelete = (id: string, name: string) => {
        if (window.confirm(`Are you sure you want to delete ${name}? This will not delete past transactions, but may cause reference issues.`)) {
            deleteAccount(id);
        }
    };

    return (
        <div className="space-y-8">

            {/* Top Level Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-indigo-50 rounded-xl p-5 border border-indigo-100 flex flex-col justify-center">
                    <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-1">Total Liquid Cash</p>
                    <h3 className="text-2xl font-bold text-indigo-900">{formatCurrency(totalBankBalance)}</h3>
                </div>
                <div className="bg-rose-50 rounded-xl p-5 border border-rose-100 flex flex-col justify-center">
                    <p className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-1">Total Credit Used</p>
                    <h3 className="text-2xl font-bold text-rose-900">{formatCurrency(totalCreditUsed)}</h3>
                    {totalCreditLimit > 0 && (
                        <div className="w-full bg-rose-200 rounded-full h-1.5 mt-2">
                            <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: `${Math.min((totalCreditUsed / totalCreditLimit) * 100, 100)}%` }}></div>
                        </div>
                    )}
                </div>
            </div>

            {/* Bank Accounts Section */}
            {bankAccounts.length > 0 && (
                <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Landmark className="w-5 h-5 text-indigo-500" />
                        Bank Accounts
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {bankAccounts.map(account => (
                            <div key={account.id} className="border border-slate-200 rounded-xl p-4 hover:border-indigo-300 transition-colors group relative bg-white">
                                <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => onEdit(account)}
                                        className="text-slate-300 hover:text-indigo-500 transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(account.id, account.name)}
                                        className="text-slate-300 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <h4 className="font-semibold text-slate-800 mb-1">{account.name}</h4>
                                <p className="text-xs text-slate-400 mb-3">Savings / Checking</p>
                                <div className="pt-3 border-t border-slate-100 font-bold text-lg text-slate-900">
                                    {formatCurrency(account.balance)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Credit Cards Section */}
            {creditCards.length > 0 && (
                <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 mt-8">
                        <CreditCard className="w-5 h-5 text-rose-500" />
                        Credit Cards
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {creditCards.map(account => {
                            const utilization = account.credit_limit ? (account.balance / account.credit_limit) * 100 : 0;
                            return (
                                <div key={account.id} className="border border-slate-200 rounded-xl p-4 hover:border-rose-300 transition-colors group relative bg-white">
                                    <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => onEdit(account)}
                                            className="text-slate-300 hover:text-indigo-500 transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(account.id, account.name)}
                                            className="text-slate-300 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <h4 className="font-semibold text-slate-800 mb-1">{account.name}</h4>
                                    <p className="text-xs text-slate-400 mb-3 flex justify-between">
                                        <span>Credit Card</span>
                                        {account.billing_day && <span className="text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded">Bill: {account.billing_day}th</span>}
                                    </p>

                                    <div className="pt-3 border-t border-slate-100 font-bold text-lg text-slate-900 flex justify-between items-end">
                                        <div>
                                            {formatCurrency(account.balance)}
                                            <span className="block text-[10px] font-normal text-slate-400">Current Balance</span>
                                        </div>
                                        {account.credit_limit && (
                                            <div className="text-right">
                                                <span className="text-sm font-medium text-slate-500">{formatCurrency(account.credit_limit)}</span>
                                                <span className="block text-[10px] font-normal text-slate-400">Limit</span>
                                            </div>
                                        )}
                                    </div>

                                    {account.credit_limit && (
                                        <div className="w-full bg-slate-100 rounded-full h-1 mt-3">
                                            <div className={`h-1 rounded-full ${utilization > 80 ? 'bg-red-500' : utilization > 30 ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${Math.min(utilization, 100)}%` }}></div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
