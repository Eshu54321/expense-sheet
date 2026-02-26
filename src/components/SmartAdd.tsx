import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, ArrowRight, Loader2, AlertCircle, ExternalLink, Camera, Image as ImageIcon, History } from 'lucide-react';
import { parseExpenseNaturalLanguage, parseExpenseImage } from '../services/geminiService';
import { supabaseService } from '../services/supabaseService';
import { Expense, ItemRate } from '../types';
import { ReviewParsedExpensesModal } from './ReviewParsedExpensesModal';

interface SmartAddProps {
  onAdd: (expenses: Omit<Expense, 'id'>[]) => void;
}

export const SmartAdd: React.FC<SmartAddProps> = ({ onAdd }) => {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<React.ReactNode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Review Modal State
  const [reviewExpenses, setReviewExpenses] = useState<Omit<Expense, 'id'>[] | null>(null);
  const [reviewItems, setReviewItems] = useState<{ name: string, quantity: string, rate: number, total: number, unit: string | null }[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Auto-complete state
  const [rates, setRates] = useState<ItemRate[]>([]);
  const [suggestions, setSuggestions] = useState<ItemRate[]>([]);
  const [cursorPosition, setCursorPosition] = useState(0);

  useEffect(() => {
    // Load rates for auto-complete
    supabaseService.getItemRates().then(setRates).catch(console.error);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);
    setCursorPosition(e.target.selectionStart || 0);

    if (!value.trim()) {
      setSuggestions([]);
      return;
    }

    // Find the current word being typed
    const lastWord = value.split(' ').pop() || '';
    if (lastWord.length < 2) {
      setSuggestions([]);
      return;
    }

    // Filter suggestions
    // Filter suggestions - simple includes check
    const matches = rates.filter(r =>
      r.name.toLowerCase().includes(lastWord.toLowerCase()) &&
      lastWord.toLowerCase() !== r.name.toLowerCase() // Don't suggest if already typed exact match
    ).slice(0, 3);

    setSuggestions(matches);

    setSuggestions(matches);
  };

  const applySuggestion = (rate: ItemRate) => {
    const words = input.split(' ');
    words.pop(); // Remove partial word
    const newValue = [...words, rate.name].join(' ') + ' ';
    setInput(newValue);
    setSuggestions([]);
    // Optionally focus back to input
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsProcessing(true);
    setError(null);

    try {
      const { expenses, items } = await parseExpenseNaturalLanguage(input);

      if (expenses && expenses.length > 0) {
        onAdd(expenses);

        // Process collected item rates in background
        if (items && items.length > 0) {
          try {
            items.forEach(async (item) => {
              if (item.rate && item.rate > 0) {
                await supabaseService.upsertItemRate({
                  name: item.name,
                  rate: item.rate,
                  unit: item.unit
                });
              }
            });
          } catch (err) {
            console.error("Failed to update rates", err);
          }
        }

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
        setPreviewImage(reader.result as string);

        try {
          const result = await parseExpenseImage(base64String);
          console.log("AI Image Parse Result:", result);
          const { expenses, items } = result;

          if (expenses && expenses.length > 0) {
            setReviewItems(items || []);
            setReviewExpenses(expenses);
          } else {
            setError("Could not extract details from image.");
          }
        } catch (err: any) {
          handleError(err);
        } finally {
          setIsProcessing(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
          if (galleryInputRef.current) galleryInputRef.current.value = '';
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError("Failed to read image file.");
      setIsProcessing(false);
    }
  };

  const handleConfirmReview = async (finalExpenses: Omit<Expense, 'id'>[]) => {
    onAdd(finalExpenses);

    // Process collected item rates in background
    if (reviewItems && reviewItems.length > 0) {
      console.log(`Tracking rates for ${reviewItems.length} items...`);
      try {
        await Promise.all(reviewItems.map(async (item) => {
          if (item.rate && item.rate > 0) {
            return supabaseService.upsertItemRate({
              name: item.name,
              rate: item.rate,
              unit: item.unit
            });
          }
        }));
      } catch (err) {
        console.error("Failed to update rates from image overview", err);
      }
    }

    setReviewExpenses(null);
    setReviewItems([]);
    setPreviewImage(null);
  };

  const handleCancelReview = () => {
    setReviewExpenses(null);
    setReviewItems([]);
    setPreviewImage(null);
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
    <div className="relative group rounded-3xl shadow-lg transition-all hover:shadow-xl mb-6">
      {/* Overflow hidden MUST be removed from parent if we want dropdown to spill out, 
          OR we keep it and ensure dropdown is inside. The current design has overflow-hidden.
          Let's change the dropdown strategy to be absolute inside the form container which is safe.
      */}
      {/* Background with clipping */}
      <div className="absolute inset-0 rounded-3xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600"></div>

        {/* Decorative Shapes (Clipped by the new wrapper) */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-white opacity-10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 rounded-full bg-indigo-500 opacity-20 blur-2xl"></div>
      </div>

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

        <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
          <div className="relative flex-grow flex items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-xl focus-within:ring-2 focus-within:ring-white/40 focus-within:bg-white/20 transition-all shadow-inner">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Tell me about your spending... e.g., 'Grocery 4500 and Uber 250'"
              disabled={isProcessing}
              className="w-full pl-6 pr-2 py-4 bg-transparent border-none text-white placeholder-indigo-100/60 focus:outline-none focus:ring-0 text-base"
            />

            <button
              type="submit"
              disabled={isProcessing || !input.trim()}
              className="p-2.5 mr-2 rounded-lg bg-white text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 disabled:hover:bg-white transition-all shadow-lg active:scale-95 flex-shrink-0 flex items-center justify-center"
            >
              {isProcessing && input.trim() ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ArrowRight className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Auto-complete Suggestions */}
          {suggestions.length > 0 && (
            <div className="absolute top-full left-0 mt-2 w-full md:w-64 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-1">
              <div className="p-2 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-slate-100">
                Saved items
              </div>
              {suggestions.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => applySuggestion(s)}
                  className="w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors flex items-center justify-between group"
                >
                  <span className="font-medium text-slate-700 capitalize group-hover:text-indigo-700">{s.name}</span>
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full group-hover:bg-indigo-100 group-hover:text-indigo-600">
                    ₹{s.rate}/{s.unit || 'unit'}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Gallery Upload Button */}
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            disabled={isProcessing}
            className="flex-shrink-0 p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all shadow-inner flex items-center justify-center group/img"
            title="Upload Screenshot"
          >
            <ImageIcon className="w-6 h-6 group-hover/img:scale-110 transition-transform" />
          </button>

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

          {/* Camera Input (Forces Camera) */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            capture="environment"
            className="hidden"
          />
          {/* Gallery Input (Allows File Picker) */}
          <input
            type="file"
            ref={galleryInputRef}
            onChange={handleImageUpload}
            accept="image/*"
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

      {reviewExpenses && (
        <ReviewParsedExpensesModal
          expenses={reviewExpenses}
          imagePreviewUrl={previewImage}
          onConfirm={handleConfirmReview}
          onCancel={handleCancelReview}
        />
      )}
    </div>
  );
};