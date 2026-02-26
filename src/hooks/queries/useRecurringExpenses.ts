import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseService } from '../../services/supabaseService';
import { RecurringExpense } from '../../types';

export const useRecurringExpenses = () => {
    return useQuery({
        queryKey: ['recurringExpenses'],
        queryFn: () => supabaseService.getRecurringExpenses(),
    });
};

export const useAddRecurringExpense = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (rule: RecurringExpense) => supabaseService.addRecurringExpense(rule),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recurringExpenses'] });
        },
    });
};

export const useUpdateRecurringExpense = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (rule: RecurringExpense) => supabaseService.updateRecurringExpense(rule),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recurringExpenses'] });
        },
    });
};

export const useDeleteRecurringExpense = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => supabaseService.deleteRecurringExpense(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recurringExpenses'] });
        },
    });
};
