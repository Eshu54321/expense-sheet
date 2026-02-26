import { supabase } from '../lib/supabase';
import { Expense, RecurringExpense, Budget, Lender, LoanTransaction, ItemRate, PriceHistory, Asset, AssetTransaction, Profile } from '../types';

export const supabaseService = {
    // --- Profiles ---

    async getProfiles(): Promise<Profile[]> {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) throw error;

        return (data || []).map((item: any) => ({
            id: item.id,
            name: item.name,
            avatar: item.avatar,
            color: item.color,
            isDefault: item.is_default
        }));
    },

    async createProfile(profile: Profile): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { error } = await supabase
            .from('profiles')
            .insert({
                id: profile.id,
                user_id: user.id,
                name: profile.name,
                avatar: profile.avatar,
                color: profile.color,
                is_default: profile.isDefault
            });

        if (error) throw error;
    },

    async updateProfile(id: string, updates: Partial<Profile>): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const dbUpdates: any = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.avatar !== undefined) dbUpdates.avatar = updates.avatar;
        if (updates.color !== undefined) dbUpdates.color = updates.color;
        if (updates.isDefault !== undefined) dbUpdates.is_default = updates.isDefault;

        const { error } = await supabase
            .from('profiles')
            .update(dbUpdates)
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) throw error;
    },

    async deleteProfile(id: string): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) throw error;
    },
    // --- Expenses ---

    async getExpenses(): Promise<Expense[]> {
        const { data, error } = await supabase
            .from('expenses')
            .select('*')
            .order('date', { ascending: false });

        if (error) throw error;

        return (data || []).map((item: any) => ({
            id: item.id,
            date: item.date,
            description: item.description,
            category: item.category,
            amount: item.amount,
            paymentMethod: item.payment_method,
            profileId: item.profile_id
        }));
    },

    async addExpenses(expenses: Expense[]): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const records = expenses.map(expense => ({
            id: expense.id,
            user_id: user.id,
            date: expense.date,
            description: expense.description,
            category: expense.category,
            amount: expense.amount,
            payment_method: expense.paymentMethod,
            profile_id: expense.profileId
        }));

        const { error } = await supabase
            .from('expenses')
            .insert(records);

        if (error) throw error;
    },

    async addExpense(expense: Expense): Promise<void> {
        return this.addExpenses([expense]);
    },

    async updateExpense(expense: Expense): Promise<void> {
        const { error } = await supabase
            .from('expenses')
            .update({
                date: expense.date,
                description: expense.description,
                category: expense.category,
                amount: expense.amount,
                payment_method: expense.paymentMethod,
                profile_id: expense.profileId
            })
            .eq('id', expense.id);

        if (error) throw error;
    },

    async deleteExpense(id: string): Promise<void> {
        const { error } = await supabase
            .from('expenses')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // --- Recurring Expenses ---

    async getRecurringExpenses(): Promise<RecurringExpense[]> {
        const { data, error } = await supabase
            .from('recurring_expenses')
            .select('*');

        if (error) throw error;

        return (data || []).map((item: any) => ({
            id: item.id,
            description: item.description,
            amount: item.amount,
            category: item.category,
            frequency: item.frequency,
            nextDueDate: item.next_due_date,
            active: item.active,
            profileId: item.profile_id
        }));
    },

    async addRecurringExpense(expense: RecurringExpense): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { error } = await supabase
            .from('recurring_expenses')
            .insert([
                {
                    id: expense.id,
                    user_id: user.id,
                    description: expense.description,
                    amount: expense.amount,
                    category: expense.category,
                    frequency: expense.frequency,
                    next_due_date: expense.nextDueDate,
                    active: expense.active,
                    profile_id: expense.profileId
                }
            ]);

        if (error) throw error;
    },

    async updateRecurringExpense(expense: RecurringExpense): Promise<void> {
        const { error } = await supabase
            .from('recurring_expenses')
            .update({
                description: expense.description,
                amount: expense.amount,
                category: expense.category,
                frequency: expense.frequency,
                next_due_date: expense.nextDueDate,
                active: expense.active,
                profile_id: expense.profileId
            })
            .eq('id', expense.id);

        if (error) throw error;
    },

    async deleteRecurringExpense(id: string): Promise<void> {
        const { error } = await supabase
            .from('recurring_expenses')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // --- Budgets ---

    async getBudgets(): Promise<Budget[]> {
        const { data, error } = await supabase
            .from('budgets')
            .select('*');

        if (error) throw error;
        return (data || []).map((item: any) => ({
            id: item.id,
            category: item.category,
            amount: item.amount,
            period: item.period,
            profileId: item.profile_id
        }));
    },

    async upsertBudget(budget: Budget): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { error } = await supabase
            .from('budgets')
            .upsert({
                id: budget.id,
                user_id: user.id,
                category: budget.category,
                amount: budget.amount,
                period: budget.period,
                profile_id: budget.profileId
            }, { onConflict: 'user_id, category, profile_id' }); // Note: DB constraint needs adjustment for profile_id if used in unique constraint

        if (error) throw error;
    },

    async deleteBudget(id: string): Promise<void> {
        const { error } = await supabase
            .from('budgets')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // --- Lenders ---

    async getLenders(): Promise<Lender[]> {
        const { data, error } = await supabase
            .from('lenders')
            .select(`
                *,
                loan_transactions (
                    amount,
                    type
                )
            `);

        if (error) throw error;

        return (data || []).map((lender: any) => {
            const transactions = lender.loan_transactions || [];
            const totalBorrowed = transactions
                .filter((t: any) => t.type === 'borrow')
                .reduce((sum: number, t: any) => sum + Number(t.amount), 0);
            const totalRepaid = transactions
                .filter((t: any) => t.type === 'repay')
                .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

            return {
                id: lender.id,
                name: lender.name,
                contactInfo: lender.contact_info,
                interestRate: lender.interest_rate,
                emiAmount: lender.emi_amount,
                loanType: lender.loan_type,
                startDate: lender.start_date,
                totalBorrowed,
                totalRepaid,
                currentBalance: totalBorrowed - totalRepaid
            };
        });
    },

    async addLender(lender: Lender): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { error } = await supabase
            .from('lenders')
            .insert({
                id: lender.id,
                user_id: user.id,
                name: lender.name,
                contact_info: lender.contactInfo,
                interest_rate: lender.interestRate,
                emi_amount: lender.emiAmount,
                loan_type: lender.loanType,
                start_date: lender.startDate
            });

        if (error) throw error;
    },

    async updateLender(lender: Lender): Promise<void> {
        const { error } = await supabase
            .from('lenders')
            .update({
                name: lender.name,
                contact_info: lender.contactInfo,
                interest_rate: lender.interestRate,
                emi_amount: lender.emiAmount,
                loan_type: lender.loanType,
                start_date: lender.startDate
            })
            .eq('id', lender.id);

        if (error) throw error;
    },

    async deleteLender(id: string): Promise<void> {
        const { error } = await supabase
            .from('lenders')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // --- Loan Transactions ---

    async getLoanTransactions(lenderId: string): Promise<LoanTransaction[]> {
        const { data, error } = await supabase
            .from('loan_transactions')
            .select('*')
            .eq('lender_id', lenderId)
            .order('date', { ascending: false });

        if (error) throw error;

        return (data || []).map((t: any) => ({
            id: t.id,
            lenderId: t.lender_id,
            date: t.date,
            type: t.type,
            amount: Number(t.amount),
            description: t.description
        }));
    },

    async addLoanTransaction(transaction: LoanTransaction): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { error } = await supabase
            .from('loan_transactions')
            .insert({
                id: transaction.id,
                lender_id: transaction.lenderId,
                user_id: user.id,
                date: transaction.date,
                type: transaction.type,
                amount: transaction.amount,
                description: transaction.description
            });

        if (error) throw error;
    },

    async deleteLoanTransaction(id: string): Promise<void> {
        const { error } = await supabase
            .from('loan_transactions')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // --- Item Rates ---

    async getItemRates(): Promise<ItemRate[]> {
        const { data, error } = await supabase
            .from('item_rates')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;

        return (data || []).map((item: any) => ({
            id: item.id,
            name: item.name,
            rate: item.rate,
            unit: item.unit,
            lastUpdated: item.last_updated
        }));
    },

    async upsertItemRate(rate: Omit<ItemRate, 'id' | 'lastUpdated'>): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const timestamp = new Date().toISOString();
        const today = timestamp.split('T')[0];

        // 1. Update latest rate
        const { error } = await supabase
            .from('item_rates')
            .upsert({
                user_id: user.id,
                name: rate.name,
                rate: rate.rate,
                unit: rate.unit,
                last_updated: timestamp
            }, { onConflict: 'user_id, name' });

        if (error) throw error;

        // 2. Log history (Duplicate check: If same item, rate, and date exists, don't add?)
        // For simplicity, we just insert. Charts can handle multiple points per day or we use DISTINCT in fetch.
        // Better: Check if we already have an entry for this item on this date.
        // Actually, prices might change intraday? Let's just log it.
        const { error: historyError } = await supabase
            .from('price_history')
            .insert({
                user_id: user.id,
                name: rate.name,
                rate: rate.rate,
                unit: rate.unit,
                date: today
            });

        if (historyError) console.error("Failed to log price history", historyError);
    },

    async getPriceHistory(name: string): Promise<PriceHistory[]> {
        const { data, error } = await supabase
            .from('price_history')
            .select('*')
            .eq('name', name)
            .order('date', { ascending: true });

        if (error) throw error;

        return (data || []).map((item: any) => ({
            id: item.id,
            name: item.name,
            rate: item.rate,
            unit: item.unit,
            date: item.date
        }));
    },

    async deleteItemRate(name: string): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // Delete from item_rates
        const { error } = await supabase
            .from('item_rates')
            .delete()
            .eq('user_id', user.id)
            .eq('name', name);

        if (error) throw error;

        // Optional: Delete history too? 
        // For now let's keep history or delete it? 
        // Usually users expect "Delete" to remove it from the list.
        // Let's delete history to be clean.
        await supabase
            .from('price_history')
            .delete()
            .eq('user_id', user.id)
            .eq('name', name);
    },

    // --- Assets ---

    async getAssets(): Promise<Asset[]> {
        const { data, error } = await supabase
            .from('assets')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;

        return (data || []).map((item: any) => ({
            id: item.id,
            name: item.name,
            type: item.type,
            currentValue: Number(item.current_value),
            purchaseValue: item.purchase_value ? Number(item.purchase_value) : undefined,
            purchaseDate: item.purchase_date,
            notes: item.notes,
            lastUpdated: item.last_updated,
            profileId: item.profile_id
        }));
    },

    async addAsset(asset: Asset): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { error } = await supabase
            .from('assets')
            .insert({
                id: asset.id,
                user_id: user.id,
                name: asset.name,
                type: asset.type,
                current_value: asset.currentValue,
                purchase_value: asset.purchaseValue,
                purchase_date: asset.purchaseDate,
                notes: asset.notes,
                last_updated: new Date().toISOString(),
                profile_id: asset.profileId
            });

        if (error) throw error;
    },

    async updateAsset(asset: Asset): Promise<void> {
        const { error } = await supabase
            .from('assets')
            .update({
                name: asset.name,
                type: asset.type,
                current_value: asset.currentValue,
                purchase_value: asset.purchaseValue,
                purchase_date: asset.purchaseDate,
                notes: asset.notes,
                last_updated: new Date().toISOString(),
                profile_id: asset.profileId
            })
            .eq('id', asset.id);

        if (error) throw error;
    },

    async deleteAsset(id: string): Promise<void> {
        const { error } = await supabase
            .from('assets')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // --- Asset Transactions ---

    async getAssetTransactions(assetId: string): Promise<AssetTransaction[]> {
        const { data, error } = await supabase
            .from('asset_transactions')
            .select('*')
            .eq('asset_id', assetId)
            .order('date', { ascending: false });

        if (error) throw error;

        return (data || []).map((t: any) => ({
            id: t.id,
            assetId: t.asset_id,
            date: t.date,
            type: t.type,
            amount: Number(t.amount),
            description: t.description
        }));
    },

    async addAssetTransaction(transaction: AssetTransaction): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { error } = await supabase
            .from('asset_transactions')
            .insert({
                id: transaction.id,
                asset_id: transaction.assetId,
                user_id: user.id,
                date: transaction.date,
                type: transaction.type,
                amount: transaction.amount,
                description: transaction.description
            });

        if (error) throw error;
    },

    async deleteAssetTransaction(id: string): Promise<void> {
        const { error } = await supabase
            .from('asset_transactions')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
