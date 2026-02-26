import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { db } from '../lib/db';
import { supabaseService } from '../services/supabaseService';

export const useOfflineSync = () => {
    const queryClient = useQueryClient();

    useEffect(() => {
        const handleOnline = async () => {
            console.log("App is online. Attempting to sync offline queue...");

            try {
                const pendingMutations = await db.mutations.orderBy('timestamp').toArray();

                if (pendingMutations.length === 0) return;

                console.log(`Processing ${pendingMutations.length} pending mutations`);

                for (const mutation of pendingMutations) {
                    try {
                        switch (mutation.type) {
                            case 'ADD_EXPENSE':
                                await supabaseService.addExpenses(mutation.payload);
                                break;
                            case 'UPDATE_EXPENSE':
                                await supabaseService.updateExpense(mutation.payload);
                                break;
                            case 'DELETE_EXPENSE':
                                await supabaseService.deleteExpense(mutation.payload);
                                break;

                            // Add other cases as needed (Budgets, Lenders)
                        }

                        // If successful, remove from queue
                        if (mutation.id) {
                            await db.mutations.delete(mutation.id);
                        }
                    } catch (itemError) {
                        console.error('Failed to process individual offline mutation:', itemError, mutation);
                        // If one fails miserably (not just network error, maybe auth), we might want to stop or continue. 
                        // For now, continue to next.
                    }
                }

                // Everything synced, invalidate all to refresh from server
                await queryClient.invalidateQueries();
                console.log("Offline sync complete");

            } catch (err) {
                console.error("Failed to process offline queue", err);
            }
        };

        window.addEventListener('online', handleOnline);

        // Also try to sync on mount if online
        if (navigator.onLine) {
            handleOnline();
        }

        return () => window.removeEventListener('online', handleOnline);
    }, [queryClient]);
};
