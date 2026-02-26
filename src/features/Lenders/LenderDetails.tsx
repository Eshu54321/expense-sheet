import React, { useState } from 'react';
import { Trash2, User, History, ArrowDownLeft, ArrowUpRight, X } from 'lucide-react';
import { Lender } from '../../types';
import { useLoanTransactions, useDeleteLender, useDeleteLoanTransaction } from '../../hooks/queries/useLenders';
import { RecordTransactionModal } from './RecordTransactionModal';

interface LenderDetailsProps {
    lender: Lender | null;
}

export const LenderDetails: React.FC<LenderDetailsProps> = ({ lender }) => {
    const { data: transactions = [] } = useLoanTransactions(lender?.id);
    const { mutateAsync: deleteLender } = useDeleteLender();
    const { mutateAsync: deleteTransaction } = useDeleteLoanTransaction();
    const [showAddTransaction, setShowAddTransaction] = useState(false);

    if (!lender) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-200 p-8">
                <User className="w-12 h-12 mb-3 opacity-50" />
                <p>Select a lender to view details</p>
            </div>
        );
    }

    const handleDeleteLender = async () => {
        if (!window.confirm("Are you sure? This will delete all transaction history with this lender.")) return;
        await deleteLender(lender.id);
    };

    const handleDeleteTransaction = async (id: string) => {
        if (!window.confirm("Delete this transaction?")) return;
        await deleteTransaction(id);
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 h-full flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-start">
                <div>
                    <h3 className="text-xl font-bold text-slate-800">{lender.name}</h3>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm">
                        <div>
                            <span className="text-slate-400">Total Borrowed:</span>
                            <span className="ml-1 font-medium text-slate-700">₹{lender.totalBorrowed.toLocaleString()}</span>
                        </div>
                        <div>
                            <span className="text-slate-400">Total Repaid:</span>
                            <span className="ml-1 font-medium text-green-600">₹{lender.totalRepaid.toLocaleString()}</span>
                        </div>
                        {lender.interestRate && (
                            <div>
                                <span className="text-slate-400">Interest:</span>
                                <span className="ml-1 font-medium text-orange-600">{lender.interestRate}%</span>
                            </div>
                        )}
                        {lender.emiAmount && (
                            <div>
                                <span className="text-slate-400">EMI:</span>
                                <span className="ml-1 font-medium text-blue-600">₹{lender.emiAmount.toLocaleString()}</span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setShowAddTransaction(true)}
                        className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
                    >
                        Add Transaction
                    </button>
                    <button
                        onClick={handleDeleteLender}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[500px]">
                {transactions.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                        <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No transactions recorded yet</p>
                    </div>
                ) : (
                    transactions.map(t => (
                        <div key={t.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg group border border-transparent hover:border-slate-100 transition-all">
                            <div className="flex items-center space-x-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${t.type === 'borrow' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                    {t.type === 'borrow' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                                </div>
                                <div>
                                    <p className="font-medium text-slate-700">{t.description || (t.type === 'borrow' ? 'Borrowed' : 'Repayment')}</p>
                                    <p className="text-xs text-slate-400">{t.date}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <span className={`font-bold ${t.type === 'borrow' ? 'text-red-600' : 'text-green-600'}`}>
                                    {t.type === 'borrow' ? '+' : '-'} ₹{t.amount.toLocaleString()}
                                </span>
                                <button
                                    onClick={() => handleDeleteTransaction(t.id)}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 transition-opacity"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {showAddTransaction && (
                <RecordTransactionModal
                    lenderId={lender.id}
                    onClose={() => setShowAddTransaction(false)}
                />
            )}
        </div>
    );
};
