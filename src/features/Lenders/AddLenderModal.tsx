import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useAddLender } from '../../hooks/queries/useLenders';

const generateId = () => crypto.randomUUID();

interface AddLenderModalProps {
    onClose: () => void;
}

export const AddLenderModal: React.FC<AddLenderModalProps> = ({ onClose }) => {
    const { mutateAsync: addLender } = useAddLender();
    const [newLenderName, setNewLenderName] = useState('');
    const [newLenderContact, setNewLenderContact] = useState('');
    const [newInterestRate, setNewInterestRate] = useState('');
    const [newEmiAmount, setNewEmiAmount] = useState('');
    const [newLoanType, setNewLoanType] = useState('Personal Loan');
    const [newStartDate, setNewStartDate] = useState(new Date().toISOString().split('T')[0]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newLenderName) return;

        await addLender({
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
        });

        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800">Add New Lender</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
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
    );
};
