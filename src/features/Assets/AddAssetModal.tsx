import React, { useState } from 'react';
import { Asset } from '../../types';
import { X, Check } from 'lucide-react';
import { useAddAsset } from '../../hooks/queries/useAssets';

interface AddAssetModalProps {
    onClose: () => void;
}

export const AddAssetModal: React.FC<AddAssetModalProps> = ({ onClose }) => {
    const addAssetMutation = useAddAsset();
    const [formData, setFormData] = useState({
        name: '',
        type: 'bank' as Asset['type'],
        currentValue: '',
        purchaseValue: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        notes: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const newAsset: Asset = {
            id: crypto.randomUUID(),
            name: formData.name,
            type: formData.type,
            currentValue: Number(formData.currentValue) || 0,
            purchaseValue: formData.purchaseValue ? Number(formData.purchaseValue) : undefined,
            purchaseDate: formData.purchaseDate || undefined,
            notes: formData.notes,
            lastUpdated: new Date().toISOString()
        };

        await addAssetMutation.mutateAsync(newAsset);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Add New Asset</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Asset Name</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent transition-all outline-none"
                            placeholder="e.g., HDFC Bank Account, Gold, House"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Asset Type</label>
                        <select
                            value={formData.type}
                            onChange={e => setFormData({ ...formData, type: e.target.value as Asset['type'] })}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent transition-all outline-none"
                        >
                            <option value="bank">Bank Account</option>
                            <option value="investment">Investment (Stocks/MF)</option>
                            <option value="real_estate">Real Estate</option>
                            <option value="crypto">Cryptocurrency</option>
                            <option value="vehicle">Vehicle</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Current Value (₹)</label>
                        <input
                            type="number"
                            required
                            min="0"
                            step="0.01"
                            value={formData.currentValue}
                            onChange={e => setFormData({ ...formData, currentValue: e.target.value })}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent transition-all outline-none"
                            placeholder="0.00"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Purchase Value (₹)</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.purchaseValue}
                                onChange={e => setFormData({ ...formData, purchaseValue: e.target.value })}
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent transition-all outline-none text-sm"
                                placeholder="Optional"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Acquired Date</label>
                            <input
                                type="date"
                                value={formData.purchaseDate}
                                onChange={e => setFormData({ ...formData, purchaseDate: e.target.value })}
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent transition-all outline-none text-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notes (Optional)</label>
                        <textarea
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent transition-all outline-none"
                            rows={2}
                            placeholder="Account numbers, locations, etc."
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
                            disabled={addAssetMutation.isPending}
                            className="flex-1 bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-white px-4 py-2 rounded-xl transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                        >
                            <Check className="w-5 h-5" />
                            <span>Save Asset</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
