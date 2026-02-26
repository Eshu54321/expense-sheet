import React from 'react';
import { Phone, ChevronRight } from 'lucide-react';
import { Lender } from '../../types';

interface LenderListProps {
    lenders: Lender[];
    selectedLender: Lender | null;
    onSelect: (lender: Lender) => void;
}

export const LenderList: React.FC<LenderListProps> = ({ lenders, selectedLender, onSelect }) => {
    return (
        <>
            {lenders.map(lender => (
                <div
                    key={lender.id}
                    onClick={() => onSelect(lender)}
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
            ))}
        </>
    );
};
