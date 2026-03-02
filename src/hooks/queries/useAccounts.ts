import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Account } from '../../types';
import { useProfile } from '../../contexts/ProfileContext';

export function useAccounts() {
    const { activeProfile } = useProfile();

    return useQuery({
        queryKey: ['accounts', activeProfile?.id],
        queryFn: async () => {
            let query = supabase
                .from('accounts')
                .select('*')
                .order('created_at', { ascending: false });

            if (activeProfile?.id) {
                query = query.eq('profile_id', activeProfile.id);
            } else {
                query = query.is('profile_id', null);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data as Account[];
        }
    });
}

export function useAddAccount() {
    const queryClient = useQueryClient();
    const { activeProfile } = useProfile();

    return useMutation({
        mutationFn: async (account: Omit<Account, 'id'>) => {
            const { data: user } = await supabase.auth.getUser();
            if (!user.user) throw new Error("Must be logged in to add an account");

            const accountData = {
                ...account,
                user_id: user.user.id,
                profile_id: activeProfile?.id || null
            };

            const { data, error } = await supabase
                .from('accounts')
                .insert([accountData])
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
        }
    });
}

export function useUpdateAccount() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...updates }: Partial<Account> & { id: string }) => {
            const { data, error } = await supabase
                .from('accounts')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
        }
    });
}

export function useDeleteAccount() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('accounts')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
        }
    });
}
