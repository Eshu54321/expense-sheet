import React, { useState, useEffect } from 'react';
import { Plus, Trash2, User, ArrowUpRight, ArrowDownLeft, History, X, ChevronRight, Phone } from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
import { Lender, LoanTransaction } from '../types';

const generateId = () => crypto.randomUUID();

export const Lenders: React.FC = () => {
    const [lenders, setLenders] = useState<Lender[]>([]);
    const [selectedLender, setSelectedLender] = useState<Lender | null>(null);
    const [transactions, setTransactions] = useState<LoanTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showAddLender, setShowAddLender] = useState(false);
    const [showAddTransaction, setShowAddTransaction] = useState(false);

    // Form States
    const [newLenderName, setNewLenderName] = useState('');
    const [newLenderContact, setNewLenderContact] = useState('');
    const [newInterestRate, setNewInterestRate] = useState('');
    const [newEmiAmount, setNewEmiAmount] = useState('');
    const [newLoanType, setNewLoanType] = useState('Personal Loan');
    const [newStartDate, setNewStartDate] = useState(new Date().toISOString().split('T')[0]);

    const [transAmount, setTransAmount] = useState('');
    const [transType, setTransType] = useState<'borrow' | 'repay'>('borrow');
    const [transDate, setTransDate] = useState(new Date().toISOString().split('T')[0]);
    const [transDesc, setTransDesc] = useState('');

    useEffect(() => {
        loadLenders();
    }, []);

    useEffect(() => {
        if (selectedLender) {
            loadTransactions(selectedLender.id);
        }
    }, [selectedLender]);

    const loadLenders = async () => {
        setIsLoading(true);
        try {
            const data = await supabaseService.getLenders();
            setLenders(data);
        } catch (error) {
            console.error("Failed to load lenders", error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadTransactions = async (lenderId: string) => {
        try {
            const data = await supabaseService.getLoanTransactions(lenderId);
            setTransactions(data);
        } catch (error) {
            console.error("Failed to load transactions", error);
        }
    };

    const handleAddLender = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newLenderName) return;

        const newLender: Lender = {
            id: generateId(),
            name: newLenderName,
            contactInfo: newLenderContact,
            interestRate: newInterestRate ? parseFloat(newInterestRate) : undefined,
            emiAmount: newEmiAmount ? parseFloat(newEmiAmount) : undefined,
            loanType: newLoanType,
            startDate: newStartDate,
            totalBorrowed: 0,
            totalRepaid: 0,
            currentBalance: 0
        };

        try {
            await supabaseService.addLender(newLender);
            setLenders(prev => [...prev, newLender]);
            setShowAddLender(false);
            setNewLenderName('');
            setNewLenderContact('');
            setNewInterestRate('');
            setNewEmiAmount('');
        } catch (error) {
            console.error("Failed to add lender", error);
        }
    };

    const handleDeleteLender = async (id: string) => {
        if (!window.confirm("Are you sure? This will delete all transaction history with this lender.")) return;
        try {
            await supabaseService.deleteLender(id);
            setLenders(prev => prev.filter(l => l.id !== id));
            if (selectedLender?.id === id) setSelectedLender(null);
        } catch (error) {
            console.error("Failed to delete lender", error);
        }
    };

    const handleAddTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLender || !transAmount) return;

        const amount = parseFloat(transAmount);
        const newTrans: LoanTransaction = {
            id: generateId(),
            lenderId: selectedLender.id,
            date: transDate,
            type: transType,
            amount: amount,
            description: transDesc
        };

        try {
            await supabaseService.addLoanTransaction(newTrans);
            setTransactions(prev => [newTrans, ...prev]);

            // Update local lender state
            const updatedLenders = lenders.map(l => {
                if (l.id === selectedLender.id) {
                    const newBorrowed = l.totalBorrowed + (transType === 'borrow' ? amount : 0);
                    const newRepaid = l.totalRepaid + (transType === 'repay' ? amount : 0);
                    return {
                        ...l,
                        totalBorrowed: newBorrowed,
                        totalRepaid: newRepaid,
                        currentBalance: newBorrowed - newRepaid
                    };
                }
                return l;
            });

            setLenders(updatedLenders);
            setSelectedLender(updatedLenders.find(l => l.id === selectedLender.id) || null);

            setShowAddTransaction(false);
            setTransAmount('');
            setTransDesc('');
        } catch (error) {
            console.error("Failed to add transaction", error);
        }
    };

    const handleDeleteTransaction = async (id: string) => {
        if (!window.confirm("Delete this transaction?")) return;
        try {
            await supabaseService.deleteLoanTransaction(id);
            const deletedTrans = transactions.find(t => t.id === id);
            setTransactions(prev => prev.filter(t => t.id !== id));

            if (deletedTrans && selectedLender) {
                // Update local lender state
                const updatedLenders = lenders.map(l => {
                    if (l.id === selectedLender.id) {
                        const newBorrowed = l.totalBorrowed - (deletedTrans.type === 'borrow' ? deletedTrans.amount : 0);
                        const newRepaid = l.totalRepaid - (deletedTrans.type === 'repay' ? deletedTrans.amount : 0);
                        return {
                            ...l,
                            totalBorrowed: newBorrowed,
                            totalRepaid: newRepaid,
                            currentBalance: newBorrowed - newRepaid
                        };
                    }
                    return l;
                });
                setLenders(updatedLenders);
                setSelectedLender(updatedLenders.find(l => l.id === selectedLender.id) || null);
            }
        } catch (error) {
            console.error("Failed to delete transaction", error);
        }
    };

    return (
        <div className="space-y-6 pb-20 md:pb-0">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Lenders & Loans</h2>
                    <p className="text-slate-500 text-sm">Track money borrowed and repayments</p>
                </div>
                <button
                    onClick={() => setShowAddLender(true)}
                    className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    <span>Add Lender</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Lenders List */}
                <div className="md:col-span-1 space-y-4">
                    {isLoading ? (
                        <div className="text-center py-8 text-slate-500">Loading...</div>
                    ) : lenders.length === 0 ? (
                        <div className="text-center py-8 bg-white rounded-xl border border-slate-200">
                            <User className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-slate-500 text-sm">No lenders found</p>
                        </div>
                    ) : (
                        lenders.map(lender => (
                            <div
                                key={lender.id}
                                onClick={() => setSelectedLender(lender)}
                                className={`bg-white p-4 rounded-xl border cursor-pointer transition-all ${selectedLender?.id === lender.id ? 'border-indigo-500 ring-1 ring-indigo-500 shadow-md' : 'border-slate-200 hover:border-indigo-300'}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                                            {lender.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-800">{lender.name}</h3>
                                            {lender.contactInfo && (
                                                <div className="flex items-center text-xs text-slate-400">
                                                    <Phone className="w-3 h-3 mr-1" />
                                                    {lender.contactInfo}
                                                </div>
                                            )}
                                            {lender.loanType && (
                                                <div className="text-xs text-slate-500 mt-0.5">{lender.loanType}</div>
                                            )}
                                        </div>
                                    </div>
                                    {selectedLender?.id !== lender.id && (
                                        <ChevronRight className="w-4 h-4 text-slate-300" />
                                    )}
                                </div>
                                <div className="mt-3 pt-3 border-t border-slate-50 flex justify-between items-end">
                                    <div>
                                        <p className="text-xs text-slate-400">Current Balance</p>
                                        <p className={`font-bold ${lender.currentBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                            ₹{Math.abs(lender.currentBalance).toLocaleString()}
                                            <span className="text-xs font-normal text-slate-400 ml-1">
                                                {lender.currentBalance > 0 ? '(Due)' : '(Paid)'}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Details & Transactions */}
                <div className="md:col-span-2">
                    {selectedLender ? (
                        <div className="bg-white rounded-xl border border-slate-200 h-full flex flex-col">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-start">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800">{selectedLender.name}</h3>
                                    <div className="flex flex-wrap gap-4 mt-2 text-sm">
                                        <div>
                                            <span className="text-slate-400">Total Borrowed:</span>
                                            <span className="ml-1 font-medium text-slate-700">₹{selectedLender.totalBorrowed.toLocaleString()}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400">Total Repaid:</span>
                                            <span className="ml-1 font-medium text-green-600">₹{selectedLender.totalRepaid.toLocaleString()}</span>
                                        </div>
                                        {selectedLender.interestRate && (
                                            <div>
                                                <span className="text-slate-400">Interest:</span>
                                                <span className="ml-1 font-medium text-orange-600">{selectedLender.interestRate}%</span>
                                            </div>
                                        )}
                                        {selectedLender.emiAmount && (
                                            <div>
                                                <span className="text-slate-400">EMI:</span>
                                                <span className="ml-1 font-medium text-blue-600">₹{selectedLender.emiAmount.toLocaleString()}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => setShowAddTransaction(true)}
                                        className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
                                    >
                                        Add Transaction
                                    </button>
                                    <button
                                        onClick={() => handleDeleteLender(selectedLender.id)}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[500px]">
                                {transactions.length === 0 ? (
                                    <div className="text-center py-12 text-slate-400">
                                        <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <p>No transactions recorded yet</p>
                                    </div>
                                ) : (
                                    transactions.map(t => (
                                        <div key={t.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg group border border-transparent hover:border-slate-100 transition-all">
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${t.type === 'borrow' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                                    {t.type === 'borrow' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-700">{t.description || (t.type === 'borrow' ? 'Borrowed' : 'Repayment')}</p>
                                                    <p className="text-xs text-slate-400">{t.date}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-4">
                                                <span className={`font-bold ${t.type === 'borrow' ? 'text-red-600' : 'text-green-600'}`}>
                                                    {t.type === 'borrow' ? '+' : '-'} ₹{t.amount.toLocaleString()}
                                                </span>
                                                <button
                                                    onClick={() => handleDeleteTransaction(t.id)}
                                                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 transition-opacity"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-200 p-8">
                            <User className="w-12 h-12 mb-3 opacity-50" />
                            <p>Select a lender to view details</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Lender Modal */}
            {showAddLender && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-slate-800">Add New Lender</h3>
                            <button onClick={() => setShowAddLender(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleAddLender} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newLenderName}
                                    onChange={e => setNewLenderName(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                    placeholder="e.g. John Doe"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Contact Info (Optional)</label>
                                <input
                                    type="text"
                                    value={newLenderContact}
                                    onChange={e => setNewLenderContact(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                    placeholder="Phone or Email"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Loan Type</label>
                                    <select
                                        value={newLoanType}
                                        onChange={e => setNewLoanType(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                                    >
                                        <option>Personal Loan</option>
                                        <option>Home Loan</option>
                                        <option>Car Loan</option>
                                        <option>Education Loan</option>
                                        <option>Credit Card</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        value={newStartDate}
                                        onChange={e => setNewStartDate(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Interest Rate (%)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={newInterestRate}
                                        onChange={e => setNewInterestRate(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                        placeholder="e.g. 10.5"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">EMI Amount</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={newEmiAmount}
                                        onChange={e => setNewEmiAmount(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                        placeholder="e.g. 5000"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                            >
                                Add Lender
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Transaction Modal */}
            {showAddTransaction && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-slate-800">Record Transaction</h3>
                            <button onClick={() => setShowAddTransaction(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleAddTransaction} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setTransType('borrow')}
                                    className={`py-2 rounded-lg font-medium text-sm transition-colors ${transType === 'borrow' ? 'bg-red-100 text-red-700 ring-1 ring-red-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                    Borrow
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTransType('repay')}
                                    className={`py-2 rounded-lg font-medium text-sm transition-colors ${transType === 'repay' ? 'bg-green-100 text-green-700 ring-1 ring-green-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                    Repay
                                </button>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="0.01"
                                    value={transAmount}
                                    onChange={e => setTransAmount(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                                <input
                                    type="date"
                                    required
                                    value={transDate}
                                    onChange={e => setTransDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
                                <input
                                    type="text"
                                    value={transDesc}
                                    onChange={e => setTransDesc(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                    placeholder="e.g. Emergency Fund"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                            >
                                Save Transaction
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
