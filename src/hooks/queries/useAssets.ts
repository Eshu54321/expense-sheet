import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseService } from '../../services/supabaseService';
import { Asset, AssetTransaction } from '../../types';

export const useAssets = () => {
    return useQuery({
        queryKey: ['assets'],
        queryFn: () => supabaseService.getAssets(),
    });
};

export const useAddAsset = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (asset: Asset) => supabaseService.addAsset(asset),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assets'] });
        },
    });
};

export const useUpdateAsset = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (asset: Asset) => supabaseService.updateAsset(asset),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assets'] });
        },
    });
};

export const useDeleteAsset = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => supabaseService.deleteAsset(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assets'] });
        },
    });
};

export const useAssetTransactions = (assetId: string | undefined) => {
    return useQuery({
        queryKey: ['assetTransactions', assetId],
        queryFn: () => {
            if (!assetId) return Promise.resolve([]);
            return supabaseService.getAssetTransactions(assetId);
        },
        enabled: !!assetId,
    });
};

export const useAddAssetTransaction = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (transaction: AssetTransaction) => supabaseService.addAssetTransaction(transaction),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['assetTransactions', variables.assetId] });
            // Invalidate assets as total value may update based on computation or triggers later
            queryClient.invalidateQueries({ queryKey: ['assets'] });
        },
    });
};

export const useDeleteAssetTransaction = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => supabaseService.deleteAssetTransaction(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assetTransactions'] });
            queryClient.invalidateQueries({ queryKey: ['assets'] });
        },
    });
};
