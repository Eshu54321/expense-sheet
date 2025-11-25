import { supabase } from '../lib/supabase';
import { Expense, RecurringExpense, Budget } from '../types';

export const supabaseService = {
    // --- Expenses ---

    async getExpenses(): Promise<Expense[]> {
        const { data, error } = await supabase
            .from('expenses')
            .select('*')
            .order('date', { ascending: false });

        if (error) throw error;
        return data || [];
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
    }
};
