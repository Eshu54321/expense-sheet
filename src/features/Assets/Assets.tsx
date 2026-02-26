import React, { useState } from 'react';
import { Plus, Building } from 'lucide-react';
import { Asset } from '../../types';
import { useAssets } from '../../hooks/queries/useAssets';
import { AssetList } from './AssetList';
import { AssetDetails } from './AssetDetails';
import { AddAssetModal } from './AddAssetModal';

export const Assets: React.FC = () => {
    const { data: assets = [], isLoading } = useAssets();
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
    const [showAddAsset, setShowAddAsset] = useState(false);

    // Keep selectedAsset in sync if assets array changes
    const currentSelectedAsset = selectedAsset
        ? assets.find(a => a.id === selectedAsset.id) || null
        : null;

    return (
        <div className="space-y-6 pb-20 md:pb-0 font-sans">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Assets & Net Worth</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Track your investments, properties, and accounts</p>
                </div>
                <button
                    onClick={() => setShowAddAsset(true)}
                    className="flex items-center space-x-2 bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-white px-4 py-2 rounded-lg transition-colors shadow-md shadow-green-500/20"
                >
                    <Plus className="w-4 h-4" />
                    <span>Add Asset</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-4">
                    {isLoading ? (
                        <div className="text-center py-8 text-slate-500">Loading...</div>
                    ) : assets.length === 0 ? (
                        <div className="text-center py-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                            <Building className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                            <p className="text-slate-500 dark:text-slate-400 text-sm">No assets found</p>
                        </div>
                    ) : (
                        <AssetList
                            assets={assets}
                            selectedAsset={currentSelectedAsset}
                            onSelect={setSelectedAsset}
                        />
                    )}
                </div>

                <div className="md:col-span-2">
                    <AssetDetails asset={currentSelectedAsset} />
                </div>
            </div>

            {showAddAsset && <AddAssetModal onClose={() => setShowAddAsset(false)} />}
        </div>
    );
};
