import React, { useState } from 'react';
import { Plus, User } from 'lucide-react';
import { Lender } from '../../types';
import { useLenders } from '../../hooks/queries/useLenders';
import { LenderList } from './LenderList';
import { LenderDetails } from './LenderDetails';
import { AddLenderModal } from './AddLenderModal';

export const Lenders: React.FC = () => {
    const { data: lenders = [], isLoading } = useLenders();
    const [selectedLender, setSelectedLender] = useState<Lender | null>(null);
    const [showAddLender, setShowAddLender] = useState(false);

    // Keep selectedLender in sync if lenders array changes
    const currentSelectedLender = selectedLender
        ? lenders.find(l => l.id === selectedLender.id) || null
        : null;

    return (
        <div className="space-y-6 pb-20 md:pb-0">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Lenders & Loans</h2>
                    <p className="text-slate-500 text-sm">Track money borrowed and repayments</p>
                </div>
                <button
                    onClick={() => setShowAddLender(true)}
                    className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    <span>Add Lender</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-4">
                    {isLoading ? (
                        <div className="text-center py-8 text-slate-500">Loading...</div>
                    ) : lenders.length === 0 ? (
                        <div className="text-center py-8 bg-white rounded-xl border border-slate-200">
                            <User className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-slate-500 text-sm">No lenders found</p>
                        </div>
                    ) : (
                        <LenderList
                            lenders={lenders}
                            selectedLender={currentSelectedLender}
                            onSelect={setSelectedLender}
                        />
                    )}
                </div>

                <div className="md:col-span-2">
                    <LenderDetails lender={currentSelectedLender} />
                </div>
            </div>

            {showAddLender && <AddLenderModal onClose={() => setShowAddLender(false)} />}
        </div>
    );
};
