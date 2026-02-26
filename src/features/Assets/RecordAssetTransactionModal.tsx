import React, { useState } from 'react';
import { Asset, AssetTransaction } from '../../types';
import { X, Check } from 'lucide-react';
import { useAddAssetTransaction, useUpdateAsset } from '../../hooks/queries/useAssets';

interface RecordAssetTransactionModalProps {
    asset: Asset;
    onClose: () => void;
}

export const RecordAssetTransactionModal: React.FC<RecordAssetTransactionModalProps> = ({ asset, onClose }) => {
    const addTransactionMutation = useAddAssetTransaction();
    const updateAssetMutation = useUpdateAsset();

    const [formData, setFormData] = useState({
        type: 'deposit' as AssetTransaction['type'],
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: ''
    });

    const isPositiveType = ['deposit', 'appreciation'].includes(formData.type);

    // Calculate preview of new value
    const numAmount = Number(formData.amount) || 0;
    const valueDelta = isPositiveType ? numAmount : -numAmount;
    const newPreviewValue = asset.currentValue + valueDelta;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Record Transaction
        const transaction: AssetTransaction = {
            id: crypto.randomUUID(),
            assetId: asset.id,
            date: formData.date,
            type: formData.type,
            amount: numAmount,
            description: formData.description
        };

        // 2. Update Asset Master Record
        const updatedAsset: Asset = {
            ...asset,
            currentValue: newPreviewValue,
            lastUpdated: new Date().toISOString()
        };

        try {
            await Promise.all([
                addTransactionMutation.mutateAsync(transaction),
                updateAssetMutation.mutateAsync(updatedAsset)
            ]);
            onClose();
        } catch (error) {
            console.error("Failed to record transaction", error);
            alert("Failed to update asset value. Please try again.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Update Value: {asset.name}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Transaction Type</label>
                        <select
                            value={formData.type}
                            onChange={e => setFormData({ ...formData, type: e.target.value as AssetTransaction['type'] })}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent transition-all outline-none"
                        >
                            <option value="deposit">Deposit Funds (Cash Added)</option>
                            <option value="appreciation">Market Appreciation (Value Up)</option>
                            <option value="withdrawal">Withdraw Funds (Cash Taken)</option>
                            <option value="depreciation">Market Depreciation (Value Down)</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount (₹)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                                <input
                                    type="number"
                                    required
                                    min="0.01"
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    className="w-full pl-8 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent transition-all outline-none font-bold"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
                            <input
                                type="date"
                                required
                                value={formData.date}
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent transition-all outline-none text-sm"
                            />
                        </div>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center text-sm">
                        <span className="text-slate-500 dark:text-slate-400">New Current Value:</span>
                        <span className={`font-bold text-lg ${isPositiveType ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                            }`}>
                            ₹{newPreviewValue.toLocaleString()}
                        </span>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                        <input
                            type="text"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent transition-all outline-none"
                            placeholder={isPositiveType ? "e.g., Monthly SIP, Sold shares" : "e.g., Withdrawn for trip, Market drop"}
                        />
                    </div>

                    <div className="pt-4 flex space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!formData.amount || addTransactionMutation.isPending}
                            className={`flex-1 text-white px-4 py-2 rounded-xl transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 ${isPositiveType ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                                }`}
                        >
                            <Check className="w-5 h-5" />
                            <span>Confirm Change</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
