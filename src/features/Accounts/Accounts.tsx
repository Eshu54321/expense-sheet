import React, { useState } from 'react';
import { Plus, CreditCard, Landmark } from 'lucide-react';
import { useAccounts } from '../../hooks/queries/useAccounts';
import { Account } from '../../types';
import { AccountsList } from './AccountsList';
import { AddAccountModal } from './AddAccountModal';

export const Accounts: React.FC = () => {
    const { data: accounts = [], isLoading } = useAccounts();
    const [showAddAccount, setShowAddAccount] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | undefined>(undefined);

    return (
        <div className="space-y-6 pb-20 md:pb-0">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Accounts & Cards</h2>
                    <p className="text-slate-500 text-sm">Track bank balances and credit limits</p>
                </div>
                <button
                    onClick={() => {
                        setEditingAccount(undefined);
                        setShowAddAccount(true);
                    }}
                    className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    <span>Add Account</span>
                </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                {isLoading ? (
                    <div className="text-center py-8 text-slate-500">Loading accounts...</div>
                ) : accounts.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="flex justify-center flex-col items-center opacity-40 mb-4">
                            <Landmark className="w-12 h-12 text-slate-400 mb-2" />
                            <CreditCard className="w-12 h-12 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700 mb-1">No Accounts Found</h3>
                        <p className="text-slate-500 text-sm max-w-sm mx-auto">
                            Add your first bank account or credit card to easily track where your money lives and how much credit you are using.
                        </p>
                    </div>
                ) : (
                    <AccountsList
                        accounts={accounts}
                        onEdit={(account) => {
                            setEditingAccount(account);
                            setShowAddAccount(true);
                        }}
                    />
                )}
            </div>

            {showAddAccount && (
                <AddAccountModal
                    onClose={() => {
                        setShowAddAccount(false);
                        setEditingAccount(undefined);
                    }}
                    accountToEdit={editingAccount}
                />
            )}
        </div>
    );
};
