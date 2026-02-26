import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseService } from '../../services/supabaseService';
import { Lender, LoanTransaction } from '../../types';

export const useLenders = () => {
    return useQuery({
        queryKey: ['lenders'],
        queryFn: () => supabaseService.getLenders(),
    });
};

export const useAddLender = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (lender: Lender) => supabaseService.addLender(lender),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lenders'] });
        },
    });
};

export const useDeleteLender = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => supabaseService.deleteLender(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lenders'] });
        },
    });
};

export const useLoanTransactions = (lenderId: string | undefined) => {
    return useQuery({
        queryKey: ['loanTransactions', lenderId],
        queryFn: () => {
            if (!lenderId) return Promise.resolve([]);
            return supabaseService.getLoanTransactions(lenderId);
        },
        enabled: !!lenderId,
    });
};

export const useAddLoanTransaction = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (transaction: LoanTransaction) => supabaseService.addLoanTransaction(transaction),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['loanTransactions', variables.lenderId] });
            // Invalidate lenders as balances update
            queryClient.invalidateQueries({ queryKey: ['lenders'] });
        },
    });
};

export const useDeleteLoanTransaction = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => supabaseService.deleteLoanTransaction(id),
        onSuccess: () => {
            // Hard to know which lender to invalidate just from ID here without complex cache reading,
            // so aggressively invalidate both.
            queryClient.invalidateQueries({ queryKey: ['loanTransactions'] });
            queryClient.invalidateQueries({ queryKey: ['lenders'] });
        },
    });
};
