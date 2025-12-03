import { supabase } from '../lib/supabase';
import { Expense, RecurringExpense, Budget, Lender, LoanTransaction } from '../types';

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
    }
};
