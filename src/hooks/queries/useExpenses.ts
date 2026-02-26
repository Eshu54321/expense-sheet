import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseService } from '../../services/supabaseService';
import { Expense } from '../../types';

export const useExpenses = () => {
    return useQuery({
        queryKey: ['expenses'],
        queryFn: () => supabaseService.getExpenses(),
    });
};

export const useAddExpenses = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (expenses: Expense[]) => {
            try {
                return await supabaseService.addExpenses(expenses);
            } catch (error: any) {
                // If offline or network error, queue the mutation in Dexie
                console.warn('Network error adding expenses, queueing for offline sync', error);
                const { db } = await import('../../lib/db');

                // For addExpenses which takes an array, we could split it or store the array
                await db.mutations.add({
                    type: 'ADD_EXPENSE',
                    payload: expenses,
                    timestamp: Date.now()
                });

                // Still return success so the UI can proceed optimistically
                return true;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
        },
    });
};

export const useUpdateExpense = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (expense: Expense) => supabaseService.updateExpense(expense),
        // Optimistic update
        onMutate: async (newExpense) => {
            await queryClient.cancelQueries({ queryKey: ['expenses'] });
            const previousExpenses = queryClient.getQueryData<Expense[]>(['expenses']);

            if (previousExpenses) {
                queryClient.setQueryData<Expense[]>(['expenses'], old =>
                    old?.map(e => e.id === newExpense.id ? newExpense : e)
                );
            }
            return { previousExpenses };
        },
        onError: (err, newExpense, context) => {
            if (context?.previousExpenses) {
                queryClient.setQueryData(['expenses'], context.previousExpenses);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
        },
    });
};

export const useDeleteExpense = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => supabaseService.deleteExpense(id),
        onMutate: async (deletedId) => {
            await queryClient.cancelQueries({ queryKey: ['expenses'] });
            const previousExpenses = queryClient.getQueryData<Expense[]>(['expenses']);

            if (previousExpenses) {
                queryClient.setQueryData<Expense[]>(['expenses'], old =>
                    old?.filter(e => e.id !== deletedId)
                );
            }
            return { previousExpenses };
        },
        onError: (err, newExpense, context) => {
            if (context?.previousExpenses) {
                queryClient.setQueryData(['expenses'], context.previousExpenses);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
        },
    });
};
