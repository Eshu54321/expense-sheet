import React, { useState } from 'react';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { parseExpenseNaturalLanguage } from '../services/geminiService';
import { Expense } from '../types';

interface SmartAddProps {
  onAdd: (expenses: Omit<Expense, 'id'>[]) => void;
}

export const SmartAdd: React.FC<SmartAddProps> = ({ onAdd }) => {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsProcessing(true);
    setError(null);

    try {
      const parsedExpenses = await parseExpenseNaturalLanguage(input);
      if (parsedExpenses && parsedExpenses.length > 0) {
        onAdd(parsedExpenses);
        setInput('');
      } else {
        setError("Couldn't parse expenses. Try being more specific.");
      }
    } catch (err) {
      setError("AI Service unavailable or key invalid.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 md:p-6 rounded-xl shadow-lg mb-4 md:mb-8 text-white relative overflow-hidden">
        {/* Background Decorative Circles */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-10 blur-2xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-white opacity-10 blur-2xl pointer-events-none"></div>

      <div className="relative z-10">
        <div className="flex items-center space-x-2 mb-2 md:mb-3">
            <Sparkles className="w-5 h-5 text-yellow-300" />
            <h2 className="text-base md:text-lg font-semibold">AI Smart Add</h2>
        </div>
        <p className="text-blue-100 mb-4 text-xs md:text-sm">
            Type naturally like "Lunch at Haldiram's ₹450" or "Uber ₹120, Coffee ₹50".
        </p>

        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type expense..."
            disabled={isProcessing}
            className="w-full pl-4 pr-12 py-3 rounded-lg bg-white/20 backdrop-blur-md border border-white/30 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/30 transition-all text-sm md:text-base"
          />
          <button
            type="submit"
            disabled={isProcessing || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-white/20 disabled:opacity-50 transition-colors"
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin text-white" />
            ) : (
              <ArrowRight className="w-5 h-5 text-white" />
            )}
          </button>
        </form>
        {error && <p className="mt-2 text-xs md:text-sm text-red-200 bg-red-900/20 py-1 px-2 rounded inline-block">{error}</p>}
      </div>
    </div>
  );
};