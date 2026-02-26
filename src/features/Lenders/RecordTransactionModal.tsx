import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useAddLoanTransaction } from '../../hooks/queries/useLenders';

const generateId = () => crypto.randomUUID();

interface RecordTransactionModalProps {
    lenderId: string;
    onClose: () => void;
}

export const RecordTransactionModal: React.FC<RecordTransactionModalProps> = ({ lenderId, onClose }) => {
    const { mutateAsync: addTransaction } = useAddLoanTransaction();
    const [transAmount, setTransAmount] = useState('');
    const [transType, setTransType] = useState<'borrow' | 'repay'>('borrow');
    const [transDate, setTransDate] = useState(new Date().toISOString().split('T')[0]);
    const [transDesc, setTransDesc] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!transAmount) return;

        await addTransaction({
            id: generateId(),
            lenderId,
            date: transDate,
            type: transType,
            amount: parseFloat(transAmount),
            description: transDesc
        });

        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800">Record Transaction</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
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
    );
};
