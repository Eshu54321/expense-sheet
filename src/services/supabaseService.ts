import { supabase } from '../lib/supabase';
import { Expense, RecurringExpense, Budget, Lender, LoanTransaction, ItemRate, PriceHistory } from '../types';

export const supabaseService = {
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
            paymentMethod: item.payment_method
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
            payment_method: expense.paymentMethod
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
                payment_method: expense.paymentMethod
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
            active: item.active
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
                    active: expense.active
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
                active: expense.active
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
        return data || [];
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
                period: budget.period
            }, { onConflict: 'user_id, category' });

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
    }
};
