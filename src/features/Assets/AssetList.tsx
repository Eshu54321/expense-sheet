import React from 'react';
import { Building, TrendingUp, DollarSign, Bitcoin, Car, Box, ChevronRight } from 'lucide-react';
import { Asset } from '../../types';

interface AssetListProps {
    assets: Asset[];
    selectedAsset: Asset | null;
    onSelect: (asset: Asset) => void;
}

const getAssetIcon = (type: string) => {
    switch (type) {
        case 'bank': return <DollarSign className="w-5 h-5" />;
        case 'investment': return <TrendingUp className="w-5 h-5" />;
        case 'real_estate': return <Building className="w-5 h-5" />;
        case 'crypto': return <Bitcoin className="w-5 h-5" />;
        case 'vehicle': return <Car className="w-5 h-5" />;
        default: return <Box className="w-5 h-5" />;
    }
};

export const AssetList: React.FC<AssetListProps> = ({ assets, selectedAsset, onSelect }) => {
    return (
        <>
            {assets.map(asset => (
                <div
                    key={asset.id}
                    onClick={() => onSelect(asset)}
                    className={`bg-white dark:bg-slate-800 p-4 rounded-xl border cursor-pointer transition-all ${selectedAsset?.id === asset.id ? 'border-[var(--accent-color)] ring-1 ring-[var(--accent-color)] shadow-md shadow-indigo-500/10 dark:shadow-indigo-500/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}
                >
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-[var(--accent-color)]/10 dark:bg-[var(--accent-color)]/20 rounded-full flex items-center justify-center text-[var(--accent-color)]">
                                {getAssetIcon(asset.type)}
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-800 dark:text-white">{asset.name}</h3>
                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 capitalize">{asset.type.replace('_', ' ')}</div>
                            </div>
                        </div>
                        {selectedAsset?.id !== asset.id && (
                            <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                        )}
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-50 dark:border-slate-700/50 flex justify-between items-end">
                        <div>
                            <p className="text-xs text-slate-400 dark:text-slate-500">Current Value</p>
                            <p className="font-bold text-slate-800 dark:text-white tracking-tight">
                                ₹{asset.currentValue.toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>
            ))}
        </>
    );
};
