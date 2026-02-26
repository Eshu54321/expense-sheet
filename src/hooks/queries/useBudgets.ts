import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseService } from '../../services/supabaseService';
import { Budget } from '../../types';

export const useBudgets = () => {
    return useQuery({
        queryKey: ['budgets'],
        queryFn: () => supabaseService.getBudgets(),
    });
};

export const useUpsertBudget = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (budget: Budget) => supabaseService.upsertBudget(budget),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['budgets'] });
        },
    });
};

export const useDeleteBudget = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => supabaseService.deleteBudget(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['budgets'] });
        },
    });
};
