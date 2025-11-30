import React, { useState, useRef } from 'react';
import { Sparkles, ArrowRight, Loader2, AlertCircle, ExternalLink, Camera, Image as ImageIcon } from 'lucide-react';
import { parseExpenseNaturalLanguage, parseExpenseImage } from '../services/geminiService';
import { Expense } from '../types';

interface SmartAddProps {
  onAdd: (expenses: Omit<Expense, 'id'>[]) => void;
}

export const SmartAdd: React.FC<SmartAddProps> = ({ onAdd }) => {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<React.ReactNode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        setError("Couldn't understand that. Try 'Lunch 500 via UPI'");
      }
    } catch (err: any) {
      handleError(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Convert to Base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];
        try {
          const parsedExpenses = await parseExpenseImage(base64String);
          if (parsedExpenses && parsedExpenses.length > 0) {
            onAdd(parsedExpenses);
            // Optional: Show success message or fill input for review
          } else {
            setError("Could not extract details from image.");
          }
        } catch (err: any) {
          handleError(err);
        } finally {
          setIsProcessing(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError("Failed to read image file.");
      setIsProcessing(false);
    }
  };

  const handleError = (err: any) => {
    if (err.message === 'API_KEY_MISSING' || err.message === 'API_KEY_INVALID') {
      setError(
        <span className="flex items-center gap-1">
          Invalid API Key.
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white font-bold inline-flex items-center ml-1"
          >
            Get one here <ExternalLink className="w-3 h-3 ml-0.5" />
          </a>
        </span>
      );
    } else {
      setError("AI Service Error. Please check your connection.");
    }
  };

  return (
    <div className="relative group rounded-2xl overflow-hidden shadow-lg transition-all hover:shadow-xl mb-6">
      {/* Vibrant Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600"></div>

      {/* Decorative Shapes */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-white opacity-10 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 rounded-full bg-indigo-500 opacity-20 blur-2xl"></div>

      <div className="relative z-10 p-5 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-yellow-300" />
            </div>
            <h2 className="text-white font-semibold tracking-wide text-sm md:text-lg">AI Smart Entry</h2>
          </div>
          <div className="hidden md:block text-xs text-indigo-100 font-medium bg-white/10 px-3 py-1 rounded-full border border-white/10">
            Powered by Gemini 2.5
          </div>
        </div>

        <form onSubmit={handleSubmit} className="relative flex gap-2">
          <div className="relative flex-grow">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tell me about your spending... e.g., 'Grocery 4500 and Uber 250'"
              disabled={isProcessing}
              className="w-full pl-6 pr-14 py-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-indigo-100/60 focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/20 transition-all text-base shadow-inner"
            />

            <button
              type="submit"
              disabled={isProcessing || !input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-lg bg-white text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 disabled:hover:bg-white transition-all shadow-lg active:scale-95 flex items-center justify-center"
            >
              {isProcessing && input.trim() ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ArrowRight className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Camera Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="flex-shrink-0 p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all shadow-inner flex items-center justify-center group/cam"
            title="Scan Receipt"
          >
            {isProcessing && !input.trim() ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Camera className="w-6 h-6 group-hover/cam:scale-110 transition-transform" />
            )}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            capture="environment"
            className="hidden"
          />
        </form>

        {/* Helper Chips for Mobile */}
        <div className="mt-5 flex gap-2 overflow-x-auto no-scrollbar md:hidden">
          {["Lunch 200", "Uber 350", "Grocery 1200", "Netflix 650"].map(hint => (
            <button
              key={hint}
              onClick={() => setInput(hint)}
              className="whitespace-nowrap px-3 py-1.5 bg-white/10 border border-white/10 rounded-full text-xs text-white/90 hover:bg-white/20 transition-colors"
            >
              {hint}
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 text-xs md:text-sm text-white bg-red-500/20 border border-red-500/30 py-2.5 px-4 rounded-lg backdrop-blur-sm animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="w-4 h-4 text-red-200 flex-shrink-0" />
            {error}
          </div>
        )}
      </div>
    </div>
  );
};