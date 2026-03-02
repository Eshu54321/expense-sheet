import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useAddAccount, useUpdateAccount } from '../../hooks/queries/useAccounts';
import { Account } from '../../types';

interface AddAccountModalProps {
    onClose: () => void;
    accountToEdit?: Account;
}

export const AddAccountModal: React.FC<AddAccountModalProps> = ({ onClose, accountToEdit }) => {
    const { mutateAsync: addAccount } = useAddAccount();
    const { mutateAsync: updateAccount } = useUpdateAccount();
    const [name, setName] = useState(accountToEdit?.name || '');
    const [type, setType] = useState<'bank_account' | 'credit_card'>(accountToEdit?.type || 'bank_account');
    const [balance, setBalance] = useState(accountToEdit ? accountToEdit.balance.toString() : '');
    const [creditLimit, setCreditLimit] = useState(accountToEdit?.credit_limit ? accountToEdit.credit_limit.toString() : '');
    const [billingDay, setBillingDay] = useState(accountToEdit?.billing_day ? accountToEdit.billing_day.toString() : '');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !balance) return;

        const numBalance = parseFloat(balance);
        const numLimit = creditLimit ? parseFloat(creditLimit) : undefined;
        let numBillingDay: number | undefined = undefined;

        if (type === 'credit_card' && billingDay) {
            numBillingDay = parseInt(billingDay, 10);
            if (numBillingDay < 1 || numBillingDay > 31) return;
        }

        if (accountToEdit) {
            await updateAccount({
                id: accountToEdit.id,
                name,
                type,
                balance: numBalance,
                credit_limit: type === 'credit_card' ? numLimit : undefined,
                billing_day: numBillingDay,
            });
        } else {
            await addAccount({
                name,
                type,
                balance: numBalance,
                credit_limit: type === 'credit_card' ? numLimit : undefined,
                billing_day: numBillingDay,
                currency: 'INR'
            } as any);
        }

        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800">{accountToEdit ? 'Edit Account' : 'Add New Account'}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Account Name</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="text-slate-900 bg-white w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            placeholder="e.g. Chase Sapphire, HDFC Savings"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Account Type</label>
                        <select
                            value={type}
                            onChange={e => setType(e.target.value as any)}
                            className="text-slate-900 bg-white w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        >
                            <option value="bank_account">Bank Account / Savings</option>
                            <option value="credit_card">Credit Card</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            {type === 'credit_card' ? 'Current Owed Balance' : 'Current Balance'}
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            required
                            value={balance}
                            onChange={e => setBalance(e.target.value)}
                            className="text-slate-900 bg-white w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            placeholder="e.g. 5000"
                        />
                    </div>

                    {type === 'credit_card' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Credit Limit</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={creditLimit}
                                    onChange={e => setCreditLimit(e.target.value)}
                                    className="text-slate-900 bg-white w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                    placeholder="e.g. 50000"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Billing Day</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="31"
                                    value={billingDay}
                                    onChange={e => setBillingDay(e.target.value)}
                                    className="text-slate-900 bg-white w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                    placeholder="e.g. 6"
                                />
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors mt-2"
                    >
                        {accountToEdit ? 'Update Account' : 'Save Account'}
                    </button>
                </form>
            </div>
        </div>
    );
};
