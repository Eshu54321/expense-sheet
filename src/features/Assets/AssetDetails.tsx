import React, { useState } from 'react';
import { Asset, AssetTransaction } from '../../types';
import { Calendar, Trash2, ArrowUpRight, ArrowDownRight, Edit2, TrendingUp, TrendingDown } from 'lucide-react';
import { useDeleteAsset, useAssetTransactions } from '../../hooks/queries/useAssets';
import { RecordAssetTransactionModal } from './RecordAssetTransactionModal';

interface AssetDetailsProps {
    asset: Asset | null;
}

export const AssetDetails: React.FC<AssetDetailsProps> = ({ asset }) => {
    const deleteAssetMutation = useDeleteAsset();
    const { data: transactions = [], isLoading } = useAssetTransactions(asset?.id);
    const [showTransactionModal, setShowTransactionModal] = useState(false);

    if (!asset) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 text-center flex flex-col justify-center items-center h-full min-h-[400px]">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700/50 rounded-full flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-600">
                    <TrendingUp className="w-8 h-8 text-slate-300 dark:text-slate-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Select an Asset</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm">Choose an asset from the list to view details, history, and record value changes.</p>
            </div>
        );
    }

    const valueChange = asset.purchaseValue ? asset.currentValue - asset.purchaseValue : 0;
    const percentChange = asset.purchaseValue ? (valueChange / asset.purchaseValue) * 100 : 0;

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this asset? All associated history will be lost.')) {
            await deleteAssetMutation.mutateAsync(asset.id);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* Header section with total value */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{asset.name}</h2>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-slate-500 dark:text-slate-400">
                            <span className="capitalize px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-slate-700 dark:text-slate-300 text-xs font-semibold">{asset.type.replace('_', ' ')}</span>
                            {asset.purchaseDate && (
                                <span className="flex items-center">
                                    <Calendar className="w-4 h-4 mr-1" />
                                    Acquired: {new Date(asset.purchaseDate).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={handleDelete}
                            className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete Asset"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Current Value</p>
                        <p className="text-3xl font-bold text-[var(--accent-color)]">
                            ₹{asset.currentValue.toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                            Last updated: {new Date(asset.lastUpdated).toLocaleDateString()}
                        </p>
                    </div>

                    <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Total Return</p>
                            <div className="flex items-baseline space-x-2">
                                <p className={`text-xl font-bold ${valueChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {valueChange >= 0 ? '+' : ''}₹{valueChange.toLocaleString()}
                                </p>
                            </div>
                        </div>
                        {asset.purchaseValue && (
                            <div className={`inline-flex items-center text-xs font-medium px-2 py-1 rounded-full w-fit mt-2 ${valueChange >= 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                {valueChange >= 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                                {Math.abs(percentChange).toFixed(2)}%
                            </div>
                        )}
                    </div>
                </div>

                {asset.notes && (
                    <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/10 text-yellow-800 dark:text-yellow-600 text-sm rounded-lg border border-yellow-100 dark:border-yellow-900/20">
                        {asset.notes}
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex space-x-3 bg-white dark:bg-slate-800">
                <button
                    onClick={() => setShowTransactionModal(true)}
                    className="flex-1 bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-white py-2.5 rounded-xl transition-colors font-medium text-sm shadow-sm flex items-center justify-center space-x-2"
                >
                    <Edit2 className="w-4 h-4" />
                    <span>Update Value / Record Change</span>
                </button>
            </div>

            {/* Transaction History */}
            <div className="p-6 bg-white dark:bg-slate-800">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Value History</h3>

                {isLoading ? (
                    <div className="text-center py-4 text-slate-500">Loading history...</div>
                ) : transactions.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                        <TrendingUp className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-500 dark:text-slate-400 text-sm">No value changes recorded yet.<br />Record an update to see it here.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {transactions.map((t: AssetTransaction) => (
                            <div key={t.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 group hover:border-[var(--accent-color)] transition-colors">
                                <div className="flex items-center space-x-4">
                                    <div className={`p-2 rounded-lg ${['deposit', 'appreciation'].includes(t.type)
                                            ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                            : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                        }`}>
                                        {['deposit', 'appreciation'].includes(t.type) ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-800 dark:text-white capitalize">{t.type}</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            {t.description || (t.type === 'deposit' ? 'Added Funds' : t.type === 'withdrawal' ? 'Withdrew Funds' : 'Market Adjustment')}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`font-bold ${['deposit', 'appreciation'].includes(t.type)
                                            ? 'text-green-600 dark:text-green-400'
                                            : 'text-red-600 dark:text-red-400'
                                        }`}>
                                        {['deposit', 'appreciation'].includes(t.type) ? '+' : '-'}₹{t.amount.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1 dark:text-slate-500">
                                        {new Date(t.date).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showTransactionModal && (
                <RecordAssetTransactionModal
                    asset={asset}
                    onClose={() => setShowTransactionModal(false)}
                />
            )}
        </div>
    );
};
