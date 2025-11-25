import { Category, Expense } from './types';

export const CATEGORIES = Object.values(Category);


export const COLORS = ['#0ea5e9', '#22c55e', '#eab308', '#f97316', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

export const INITIAL_EXPENSES: Expense[] = [
  { id: '1', date: '2023-10-25', description: 'Grocery Run at Reliance Smart', category: Category.FOOD, amount: 4500.00, paymentMethod: 'UPI' },
  { id: '2', date: '2023-10-26', description: 'Monthly Rent', category: Category.HOUSING, amount: 25000.00, paymentMethod: 'Bank Transfer' },
  { id: '3', date: '2023-10-26', description: 'Uber to Office', category: Category.TRANSPORT, amount: 450.00, paymentMethod: 'Paytm' },
  { id: '4', date: '2023-10-27', description: 'Freelance Project Income', category: Category.INCOME, amount: -45000.00, paymentMethod: 'Bank Transfer' },
  { id: '5', date: '2023-10-27', description: 'Netflix Premium', category: Category.ENTERTAINMENT, amount: 649.00, paymentMethod: 'Credit Card' },
  { id: '6', date: '2023-10-28', description: 'New Running Shoes', category: Category.SHOPPING, amount: 3500.00, paymentMethod: 'Debit Card' },
  { id: '7', date: '2023-10-28', description: 'Coffee with Client', category: Category.FOOD, amount: 850.00, paymentMethod: 'Cash' },
  { id: '8', date: '2023-10-29', description: 'Petrol', category: Category.TRANSPORT, amount: 2000.00, paymentMethod: 'UPI' },
];